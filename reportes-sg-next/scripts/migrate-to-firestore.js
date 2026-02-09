/**
 * migrate-to-firestore.js
 * 
 * Migra TODOS los datos estáticos JSON a Firestore.
 * 
 * Estructura resultante en Firestore:
 * 
 *   config/app                          → { activeSimulation, availableSimulations }
 *   students/{id}                       → { email, nombre, apellidos, institucion }
 *   students/{id}/results/{simId}       → { ...estudiante data }
 *   simulations/{simId}                 → { id, name, date, totalStudents } (manifest)
 *   simulations/{simId}/data/estadisticas → { ...estadisticas_grupo }
 *   simulations/{simId}/data/invalidaciones → { items: [...] }
 *   admin_students/{simId}/chunks/{n}   → { estudiantes: [...batch] }
 * 
 * Uso:
 *   node scripts/migrate-to-firestore.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// =============================================
// CONFIG
// =============================================
const DATA_DIR = path.join(__dirname, '..', 'public', 'data');
const SIMULATIONS = ['SG11-08', 'SG11-09'];
const ACTIVE_SIMULATION = 'SG11-09';
const BATCH_SIZE = 400; // Firestore batch limit is 500, keep margin
const CHUNK_SIZE = 50;  // Students per admin_students chunk

// =============================================
// Initialize Firebase Admin
// =============================================

// Try service account file in multiple locations
const possiblePaths = [
    path.join(__dirname, '..', 'service-account.json'),
    path.join(__dirname, '..', '..', 'service-account.json'),
    path.join(__dirname, '..', 'credenciales-sg-firebase-adminsdk.json'),
];

let serviceAccountPath = possiblePaths.find(p => fs.existsSync(p));

if (serviceAccountPath) {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
    console.log('✅ Firebase Admin initialized with service account');
} else {
    // Try Application Default Credentials
    admin.initializeApp({
        projectId: 'credenciales-sg',
    });
    console.log('⚠️  No service account found. Using Application Default Credentials.');
    console.log('   Place a service account JSON at: scripts/../service-account.json');
}

const db = admin.firestore();

// =============================================
// Helpers
// =============================================

function readJSON(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
    } catch (err) {
        console.warn(`⚠️  Could not read ${filePath}:`, err.message);
        return null;
    }
}

async function commitBatch(batch, label) {
    try {
        await batch.commit();
    } catch (err) {
        console.error(`❌ Error committing batch [${label}]:`, err.message);
        throw err;
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// =============================================
// 1. Config
// =============================================
async function migrateConfig() {
    console.log('\n📋 1/6 Migrating config/app...');

    const configRef = db.collection('config').doc('app');
    await configRef.set({
        activeSimulation: ACTIVE_SIMULATION,
        availableSimulations: SIMULATIONS,
        migratedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`   ✅ config/app → active: ${ACTIVE_SIMULATION}, available: [${SIMULATIONS.join(', ')}]`);
}

// =============================================
// 2. Students (profiles from auth_index.json)
// =============================================
async function migrateStudentProfiles() {
    console.log('\n👤 2/6 Migrating student profiles...');

    const authIndex = readJSON(path.join(DATA_DIR, 'auth_index.json'));
    if (!authIndex) return;

    let count = 0;
    let batch = db.batch();
    let batchCount = 0;

    // Also collect from individual student files for richer data
    const estudiantesDir = path.join(DATA_DIR, 'estudiantes');
    const richDataMap = new Map();

    if (fs.existsSync(estudiantesDir)) {
        const files = fs.readdirSync(estudiantesDir).filter(f => f.endsWith('.json'));
        for (const file of files) {
            const data = readJSON(path.join(estudiantesDir, file));
            if (data && data.informacion_personal) {
                const id = file.replace('.json', '');
                richDataMap.set(id, data.informacion_personal);
            }
        }
        console.log(`   📂 Found ${richDataMap.size} detailed student profiles`);
    }

    for (const entry of authIndex) {
        const studentId = entry.i;
        const email = entry.e.toLowerCase().trim();

        // Get rich data if available
        const rich = richDataMap.get(studentId);

        // Parse name from auth_index format "INST - NOMBRE COMPLETO"
        let nombre, apellidos, institucion;
        if (rich) {
            nombre = rich.nombres || '';
            apellidos = rich.apellidos || '';
            institucion = rich.institucion || '';
        } else {
            const parts = entry.n.includes(' - ') ? entry.n.split(' - ') : ['', entry.n];
            institucion = parts[0].trim();
            const fullName = parts[1] || parts[0];
            const words = fullName.trim().split(' ');
            nombre = words.slice(0, Math.ceil(words.length / 2)).join(' ');
            apellidos = words.slice(Math.ceil(words.length / 2)).join(' ');
        }

        const docRef = db.collection('students').doc(studentId);
        batch.set(docRef, {
            email,
            nombre,
            apellidos,
            institucion,
            nombreCompleto: rich?.nombre_completo || entry.n,
            telefono: rich?.telefono || null,
            tipoIdentificacion: rich?.tipo_identificacion || null,
            municipio: rich?.municipio || null,
        }, { merge: true });

        count++;
        batchCount++;

        if (batchCount >= BATCH_SIZE) {
            await commitBatch(batch, `students ${count}`);
            batch = db.batch();
            batchCount = 0;
            process.stdout.write(`   📤 ${count} profiles...`);
            await sleep(100);
        }
    }

    if (batchCount > 0) {
        await commitBatch(batch, `students final`);
    }

    console.log(`\n   ✅ ${count} student profiles migrated`);
}

// =============================================
// 3. Student Results (per simulation)
// =============================================
async function migrateStudentResults() {
    console.log('\n📊 3/6 Migrating student results...');

    for (const simId of SIMULATIONS) {
        const simDir = path.join(DATA_DIR, 'simulations', simId, 'estudiantes');

        if (!fs.existsSync(simDir)) {
            console.log(`   ⚠️  No estudiantes dir for ${simId}, skipping`);
            continue;
        }

        const files = fs.readdirSync(simDir).filter(f => f.endsWith('.json'));
        console.log(`   📂 ${simId}: ${files.length} student files`);

        let count = 0;
        let batch = db.batch();
        let batchCount = 0;

        for (const file of files) {
            const studentId = file.replace('.json', '');
            const data = readJSON(path.join(simDir, file));

            if (!data) continue;

            const docRef = db.collection('students').doc(studentId)
                .collection('results').doc(simId);

            batch.set(docRef, data);
            count++;
            batchCount++;

            if (batchCount >= BATCH_SIZE) {
                await commitBatch(batch, `results ${simId} ${count}`);
                batch = db.batch();
                batchCount = 0;
                process.stdout.write(`\r   📤 ${simId}: ${count}/${files.length}...`);
                await sleep(100);
            }
        }

        if (batchCount > 0) {
            await commitBatch(batch, `results ${simId} final`);
        }

        console.log(`\r   ✅ ${simId}: ${count} student results migrated`);
    }
}

// =============================================
// 4. Simulation metadata + stats + invalidaciones
// =============================================
async function migrateSimulationData() {
    console.log('\n🏷️  4/6 Migrating simulation metadata & statistics...');

    for (const simId of SIMULATIONS) {
        const simDir = path.join(DATA_DIR, 'simulations', simId);

        // Manifest
        const manifest = readJSON(path.join(simDir, 'manifest.json'));
        if (manifest) {
            await db.collection('simulations').doc(simId).set(manifest);
            console.log(`   ✅ ${simId}/manifest`);
        }

        // Statistics
        const statsPath = path.join(simDir, 'estadisticas_grupo.json');
        const stats = readJSON(statsPath);
        if (stats) {
            await db.collection('simulations').doc(simId)
                .collection('data').doc('estadisticas').set(stats);
            console.log(`   ✅ ${simId}/estadisticas`);
        }
    }

    // Invalidaciones (global, but store per simulation)
    const invalidaciones = readJSON(path.join(DATA_DIR, 'invalidaciones.json'));
    if (invalidaciones && invalidaciones.invalidaciones) {
        // Map simulation names to IDs
        const simNameMap = {
            'S11 S-08': 'SG11-08',
            'S11 S-09': 'SG11-09',
        };

        for (const simId of SIMULATIONS) {
            const items = invalidaciones.invalidaciones.filter(inv => {
                const mappedId = simNameMap[inv.simulacro] || inv.simulacro;
                return mappedId === simId;
            });

            await db.collection('simulations').doc(simId)
                .collection('data').doc('invalidaciones').set({ items });
            console.log(`   ✅ ${simId}/invalidaciones (${items.length} items)`);
        }
    }
}

// =============================================
// 5. Admin Students (chunked for large datasets)
// =============================================
async function migrateAdminStudents() {
    console.log('\n📦 5/6 Migrating admin_students (chunked)...');

    for (const simId of SIMULATIONS) {
        const studentsPath = path.join(DATA_DIR, 'simulations', simId, 'students.json');
        const rawData = readJSON(studentsPath);

        if (!rawData) {
            console.log(`   ⚠️  No students.json for ${simId}`);
            continue;
        }

        // Extract students array from various formats
        let students = [];
        if (Array.isArray(rawData)) {
            students = rawData;
        } else if (rawData.estudiantes && Array.isArray(rawData.estudiantes)) {
            students = rawData.estudiantes;
        } else if (rawData.students && typeof rawData.students === 'object') {
            students = Object.values(rawData.students);
        }

        console.log(`   📂 ${simId}: ${students.length} students to chunk`);

        // Split into chunks
        const chunks = [];
        for (let i = 0; i < students.length; i += CHUNK_SIZE) {
            chunks.push(students.slice(i, i + CHUNK_SIZE));
        }

        let batch = db.batch();
        let batchCount = 0;

        for (let i = 0; i < chunks.length; i++) {
            const chunkRef = db.collection('admin_students').doc(simId)
                .collection('chunks').doc(`chunk_${i}`);

            batch.set(chunkRef, { estudiantes: chunks[i] });
            batchCount++;

            if (batchCount >= BATCH_SIZE) {
                await commitBatch(batch, `admin_students ${simId} chunk ${i}`);
                batch = db.batch();
                batchCount = 0;
            }
        }

        if (batchCount > 0) {
            await commitBatch(batch, `admin_students ${simId} final`);
        }

        console.log(`   ✅ ${simId}: ${chunks.length} chunks (${students.length} students)`);
    }
}

// =============================================
// 6. Rankings (optional, derived from students)
// =============================================
async function migrateRankings() {
    console.log('\n🏆 6/6 Rankings are derived from admin_students — no separate migration needed.');
    console.log('   ✅ Rankings will be computed at runtime from getAllStudents()');
}

// =============================================
// Main
// =============================================
async function main() {
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║   🔥 Firestore Migration — ReportesSG       ║');
    console.log('╚══════════════════════════════════════════════╝');
    console.log(`\nProject: credenciales-sg`);
    console.log(`Data dir: ${DATA_DIR}`);
    console.log(`Simulations: ${SIMULATIONS.join(', ')}`);
    console.log(`Active: ${ACTIVE_SIMULATION}`);

    const startTime = Date.now();

    try {
        await migrateConfig();
        await migrateStudentProfiles();
        await migrateStudentResults();
        await migrateSimulationData();
        await migrateAdminStudents();
        await migrateRankings();

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log('\n╔══════════════════════════════════════════════╗');
        console.log(`║   ✅ Migration complete! (${elapsed}s)              ║`);
        console.log('╚══════════════════════════════════════════════╝');
        console.log('\nFirestore collections created:');
        console.log('  • config/app');
        console.log('  • students/{id}');
        console.log('  • students/{id}/results/{simId}');
        console.log('  • simulations/{simId}');
        console.log('  • simulations/{simId}/data/estadisticas');
        console.log('  • simulations/{simId}/data/invalidaciones');
        console.log('  • admin_students/{simId}/chunks/{n}');
    } catch (err) {
        console.error('\n❌ Migration failed:', err);
        process.exit(1);
    }

    process.exit(0);
}

main();
