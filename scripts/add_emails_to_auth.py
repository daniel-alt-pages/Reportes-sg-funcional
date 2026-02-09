#!/usr/bin/env python3
"""
Script para agregar correos nuevos al auth_index.json
"""
import json
import os

# Nuevos estudiantes a agregar
NUEVOS_ESTUDIANTES = """1122928226	ANTHONY ESNEIDER BAUTISTA BERNAL	anthu375x2@gmail.com
1095806347	ANA MARÍA LIZARAZO RINCÓN	ana.lizarazo76@gmail.com
1105374916	VALENTINA VANEGAS GARCIA	valentinavanegasg09@gmail.com
1029653948	SARA NIKOL ORTEGA FRANCO	fatheart.lvs.t@gmail.com
1157963701	AVIMELEC PARRA CORREA	abimelecmeche10@gmail.com
1085917551	SAMUEL NICOLAS BENAVIDES LOPEZ	samuelnicolas0207@gmail.com
1111543838	JUAN SEBASTIAN CARLOSAMA VALLEJO	sebastianvallejogenially@gmail.com
1091977784	BRYAN ALEXANDER PEDRAZA GONZALEZ	bryanysofipedraza@gmail.com
1110041815	MARIANA SOFÍA GOMEZ BECERRA	marianasofia31122006@gmail.com
1110297721	EMILY MARCELA VARGAS ORDÓÑEZ	emily.marcela.vargas@gmail.com
1117513981	BRIYITH DAYANA OSORIO MOLINA	do1371521@gmail.com
1063961186	SANTIAGO CARRASQUILLA SUAZA	carrasantiago20@gmail.com
1075796108	KEVIN SANTIAGO RINCON GIL	estudiorinconkevin@gmail.com
1107856323	SARA DANIELA GALLARDO BELTRÁN	saradanielagallardobel@gmail.com
1080054769	DANIEL ALEJANDRO SOLARTE RIASCOS	alejandrosolarte2509@gmail.com
1047442757	SANTIAGO DE JESUS GUTIÉRREZ MONSALVE	sssantx0@gmail.com
1077228978	JUAN ESTEBAN HOME PAJOY	juanhome091215@gmail.com
1100958315	EMILY STHEFANY RONDON CONTRERAS	emilyrondonc2024@gmail.com
1066875471	MARIA DANIELA ESQUEA ACEVEDO	danielaesquea816@gmail.com
1085173122	JOSÉ JULIÁN ZAMBRANO FUENTES	josejulianzambranofuentea@gmail.com
1065891331	MARÍA MILAGROS PAVA ARIAS	milaagritous@gmail.com
1067815086	DANIELA STEFANIA MEJIA MARTINEZ	danielamejimar@gmail.com
1109118764	SARA VICTORIA CRUZ PROAÑOS	sarita0203040506@gmail.com
1049024150	LUNA VALENTINA MORALES IDARRAGA	lunavmorales@gmail.com
1058548381	JHON ALEXANDER ARANDA SANTACRUZ	arandasantacruzjhonalexander@gmail.com
1032184613	EMILY OTERO BORJA	emilyotero2010@gmail.com
1146634145	MIRIAN TENORIO ROJAS	mtenorio.rs@gmail.com
1155214072	SARA YULIETH ASPRILLA CAÑIZALES	saraacanizales26@gmail.com
1092460409	MARIANA CEBALLOS GARZÓN	isacardonabex@gmail.com
1130268095	FABIAN DE JESUS MIRANDA VARELO	fabi302806@gmail.com
1097499747	JOHAN ALEXANDER PEÑALOZA PARRADO	johaanalexanderparra@gmail.com
1044639981	DIOSA MARIA GUERRERO CABARCAS	diosaguerrero1908@gmail.com
1058548781	JUAN MANUEL MUÑOZ NAVIA	juanmanuelmunos95@gmail.com
1169713398	CHRISTIAN DAVID ARRIETA HERNÁNDEZ	christianarrieta19@gmail.com
1029800219	JULIANA ANDREA RUDAS HUERTAS	julianarudas6@gmail.com
1066573090	LUIS FERNANDO PETRO TREJO	luisfernandopetrotrejo@gmail.com
1138274816	JUAN CAMILO JARAMILLO MONTENEGRO	ghjuanjuanca@gmail.com
1126452201	ISABELLA LOPEZ CARDONA	isalopezcardona09@gmail.com
1102635521	YURY ANDREA CASTELLANOS GAST	andreitacast.xx@gmail.com
1101261609	JULIO CESAR MEJIA ARCINIEGAS	juliocesrmejia202@gmail.com
1077231248	SARAH ISABELLA HOYOS HERNANDEZ	hoyoshernandezsaraisabella@gmail.com
1104945170	NICOLAS ANDRES LOAIZA LEIVA	nianlole11@gmail.com
1120574144	BREYMAN ALEXÁNDER ARIZA RODRÍGUEZ	breymanarizarodriguez@gmail.com
1075541298	KAROL DAYANA RUBIANO DELGADO	kroolrubiano3011@gmail.com
1044219028	ALEJANDRA SOPHIA CASTILLA PINZÓN	alejandracaspin@gmail.com
1052391404	MANUELA ALEJANDRA LÓPEZ AGUILAR	manux.5516@gmail.com
1004577058	RICHARD ARMANDO JIMÉNEZ CORAL	armandojc2003@gmail.com
1040739119	ANA SOFIA MUÑOZ CASTAÑO	sofiaestrellasapa@gmail.com
1081762386	SHEYLA MEDINA GARCIA	sheylamedinagarcia13@gmail.com
1082924085	ANGELY JULISSA ANAYA ORTIZ	angelyanayap@gmail.com
1095807668	VALERIA RUBIO INFANTE	rubioinfantevaleria@gmail.com
1121418643	DANNA CAMILA ALVAREZ CAMACHO	grado5adannacamilaalvarez@gmail.com
1002367670	CRISTIAN CAMILO TORRES BELTRAN	cristian.torres09@uptc.edu.co
1075793667	MARÍA DE LOS ÁNGELES MALDONADO GONZÁLEZ	maria.dangelesgg@gmail.com
1149934544	ANDRES FELIPE HERNANDEZ ARIAS	andres20081022@gmail.com
1066870583	CAROLINA DANIELA MAESTRE SALAS	carolinadanie07@gmail.com
1095310342	GONZALO ANDRÉS PRADA OTERO	gonzaloandresprada@gmail.com
1110484282	CAROLINA BONILLA BETANCOURTH	basquezeliana@gmail.com
1069489668	MARTIN ELIAS CALDERA CORONADO	mariaeugeniacoronandoozuna@gmail.com
1104936736	CAMILO MORALES AYALA	moralescapi2005@gmail.com
1110293421	JUAN DAVID LOPEZ SANCLEMENTE	juandlopezsan@gmail.com
1096207726	NASLY DELGADO RAMÍREZ	naslydelgado27@gmail.com
1044639043	LAURA VALENTINA DÍAZ BARRIOS	lauravalentinadiazbarrios09@gmail.com
1103862082	MARIA JOSE TOVAR OLIVERA	majotovar21@gmail.com
1047431937	ZARETH SOFIA TUIRAN POLO	zarethtuiran@gmail.com
1094052589	DANNA VALERIA HERNANDEZ AYALA	valeriaaahern@gmail.com
1067608145	MARIAN ABBY VERGEL GONZALEZ	marianabbyvergel@gmail.com
1044920668	FERNEY JUNIOR GUTIERREZ SIMANCAS	gutierrezferney79@gmail.com
1076907474	JESUS DAVID CEBALLOS RODRIGUEZ	davidceballosro@gmail.com
1086774484	PAULA ANDREA PEDROZA JACOME	paupjacome14@gmail.com
1076245818	JUANA MARÍA JIMÉNEZ TOVAR	jimenezjuanita.210@gmail.com
1138274857	DORIAN SAMUEL PUENTES PLAZAS	samuelpuentesp.318@gmail.com
1042858004	MARIANA JUDITH GARCÍA GUZMÁN	marianajudithgarcia.idetp@gmail.com
1104871573	ANA SOFIA ROMANA IRIARTE	sofiaromanairiarte@gmail.com
1043979205	VALENTINA OCAMPO SERPA	valentinaocampo884@gmail.com
1076906829	JHAN POOL CRUZ RIVAS	jhanpoolcruzrivas@gmail.com
1042260050	MATEO ALEJANDRO HERRERA VALLEJA	mateoherrerav709@gmail.com
1041634016	ISSI REL JACH BARRIENTOS	jaissirbarrientos@gmail.com
1104547587	JUAN DAVID LUGO TORRES	juandavidlugotorres@gmail.com
1092533604	BRAYAN SNEIDER PELAEZ BARON	brayanpelaez542@gmail.com
1058932026	LAURA ISABEL SARRIA CASTILLO	laura06165@gmail.com
1065632863	NICOLAS DAVID GIRALDO SARMIENTO	giraldosarmientonicodavid@gmail.com
1016835086	SAMARA NEVA MOYANO	samaranevam@gmail.com
1067606378	ISABEL SOFIA ARAGÓN MEJÍA	isaragonm2709@gmail.com
1065605787	MARCO JOSÉ ARIAS CABARCAS	maxfrioarias@gmail.com
1067166704	JOSÉ JULIÁN GENES RUIZ	josegenes1203@gmail.com
1194965164	ANDRÉS CAMILO CONTRERAS PÉREZ	andrescontreras21027@gmail.com
1102636212	ANGIE SOFIA GRANADOS OCHOA	ochoaangie1608@gmail.com
1102518311	JULIAN ALEJANDRO DIAZ MENDOZA	julianalejandrodiazmendoza@gmail.com
1042857498	SANTIAGO GARCIA CASTILLO	santiago.garcia.c2009@gmail.com
1101756438	JHON SEBASTIÁN CASTAÑEDA DUARTE	jhonsebascastaduarte@gmail.com
1095307497	JULIAN DAVID SILVA DIAZ	silvajulian731@gmail.com
1044637488	LUIS ALEJANDRO CHAVEZ GUERRERO	s4291521@gmail.com
1085908598	YEFERSON LIBARDO CHAUCANES GONZALEZ	jefergonza785@gmail.com
1081700288	DANIELA ALEXANDRA VALENCIA ÁVILA	daniel4valenci4@gmail.com
1102637143	DANIEL ANDRÉS PINTO ANAYA	niichi083@gmail.com
1059843088	DARWIN ALEXIS ROSERO ROSERO	darwinrosero552@gmail.com
1105469880	SAMUEL ESTEBAN FIGUEROA HERNÁNDEZ	grado5asamuelfigueroa@gmail.com
1142716693	ISABELLA VIVIESCAS ROMERO	isabellaviviescas03@gmail.com
1112050286	VALENTINA RODRÍGUEZ BELTRAN	valenrodribel@gmail.com
1069487805	GUBER AGUAS AGUAS CASTRO	castroclarena881@gmail.com
1080055415	DANNY JEFERSON TANDIOY MALUA	jhoanamalu2@gmail.com
1047453142	ANGELY VIANA VASQUEZ	angelyviana2010@gmail.com
1006743818	YULIANIS MARIA MENDOZA BARBOSA	menyulianis2002@gmail.com
1029883902	MAIRA SOFIA MARTINEZ AVILEZ	maaviowo@gmail.com
1033103778	ISABELLA GELVES BERTELL	gelvesisabella6@gmail.com
1073821473	ANDRÉS MAURICIO DURANGO HERNÁNDEZ	andresdurango1309@gmail.com
1053334092	DAVID NICOLAS SALINAS FORERO	salinasforeronicolas2000@gmail.com
1054870748	ALEJANDRO LOAIZA SARAVIA	alejothemaster1@gmail.com
1050956923	DAIRO ALBERTO CARDENAS DÍAZ	cardenasdiazd973@gmail.com
1106227901	LAURA ISABEL AUBILLUS GARCIA	ubilluslauraisabela@gmail.com
1126140521	SAMUEL DAVID GOMEZ ARCOS	sdga1107@gmail.com
1155213317	SOFIA RENDON CANTILLO	rendon.cantillo@gmail.com
1093855665	GABRIELA SOFIA CORONEL HERNÁNDEZ	gabrielacoronelhdez@gmail.com
94513460	ANDRÉS IGNACIO MONTEALEGRE ORDÓÑEZ	andresmontealegreordonez@gmail.com
1029883931	SANDRA YULIETH PEDRAZA GARCIA	sandrayuliethpedrazagarcia@gmail.com
1091204793	SOFIA DIAZ LINARES	sofiaiaz112286@gmail.com
1069486724	SHEILYN LOPEZ RESTÁN	lopezrestansheilyn@gmail.com
1005650933	LUIS FERNANDO HURTADO ARDILA	luisfercho130@gmail.com
1105477490	SANTIAGO MOLINA BARRERA	santiagomolina.barrera2@gmail.com
1104262349	MOISÉS LARA MERCADO	moiseslaramercado536@gmail.com
1057981526	BRIHAM FELIPE VARGAS ROCHA	brian240709@gmail.com
1065636331	SHEIRITH PAOLA BRITO MIRANDA	sheirithbrito10@gmail.com
1059241809	MANUEL ALEJANDRO VIDAL ORDÓÑEZ	manuelalejandrovidalordonez@gmail.com
1016716877	WILLIAM DAVID DURAN ARCE	williamdavidduranarce3@gmail.com
1048071942	MELISSA PAOLA BERMEJO RAMOS	melissabermejoramos0724@gmail.com
1024502309	CAROL YULIANA HERRERA DUARTE	herreracarol08hd@gmail.com
1122521893	SANTIAGO MANCERA HERNÁNDEZ	santiagomancerahernandez@gmail.com
1050955964	JUAN DE DIOS MARRUGO BARRIOS	juanmarrugo2009@gmail.com
1013126644	JUAN CARLOS RODRÍGUEZ DUCUARA	juancarro24@gmail.com
1138026766	JORGE LUIS PASTRANA BELTRAN	jorgeluispasar6@gmail.com
1085915140	MICHELL DANIELA CIFUENTES NIÑO	cifuenmichell@gmail.com
1069485760	FELIPE QUINTERO PATERNINA	sulaypaternina@gmail.com
1032184918	HAYLIN FERNANDA PINO BUENAÑO	haylinpino3@gmail.com
1079536118	ISABELLA LARRAZÁBAL CARDOSO	isabella.larrazabal899@gmail.com
1043306345	ALEJANDRO LUENGAS VERGARA	aluengasv@gmail.com
1027402319	DELIA SALOMÉ SEPÚLVEDA GONZÁLEZ	desasego@gmail.com
1048072342	SARAH MICHELLE MARTINEZ REBOLLEDO	sarahmareb@gmail.com
1106333364	MÓNICA ALEXANDRA GUZMÁN OSORIO	moniguz290709@gmail.com
1043004497	DANIELA GARCÍA PACHECO	dgarciaaap@gmail.com
1096702256	ISABEL SOFÍA SEPÚLVEDA BERNAL	sotigure@gmail.com
1109548694	ANGEL DAVID ZAPATA VARGAS	zzapxta07@gmail.com
1083892824	VALERIE ALEJANDRA PÉREZ ORTEGA	valerieperez085@gmail.com
1144627582	ANYELA DAYANA PAJOY ANDRADE	dayanaandrade1948@gmail.com
1140014252	SARHA KATALINA TORRES CALDERON	sarhatorres978@gmail.com
1128149382	MIGUEL ANTONIO LEONES YEPES	miguelleones124@gmail.com
1069486269	SANTIAGO JESÚS BONILLA SERPA	santiagobonillaienal@gmail.com
1082803801	MARÍA ALEXANDRA CRISPÍN VARGAS	crisvamalia@gmail.com
1029601434	MARIANA ISABELLA SANCHEZ CAICEDO	marianacaice21@gmail.com
1069488246	MARÍA ANDREA PINTO MONSALVE	mariaandreapinto75@gmail.com
1075798438	MARIANA QUESADA VARGAS	marianaquesada1327@gmail.com
1019997557	MARÍA JOSÉ ROMERO PLATA	mariajoseromeroplata@gmail.com
1048068794	ISMAEL HERNAN OSORIO CAICEDO	osoriocaicedoismaelhernan@gmail.com
1126120666	FERNANDO ALFONSO ARAUJO SANCHEZ	fernandoalfonsoas@gmail.com
1019997558	SARAH VALENTINA ROMERO PLATA	sarahvalentinaromeroplata@gmail.com
1126459774	DANA KATIUSKA ANGELINA SOUSA TISOY	valdana2613@gmail.com
1062438387	MARÍA CELESTE OLIVEROS HOYOS	mariacelesteoliveroshoyos@gmail.com
1059236790	XIOMARA GIRONZA PINO	marianabeer60@gmail.com
1105373328	MARIANA RENGIFO CUELLAR	marirengifoc22@gmail.com
1052080022	ANDRES FELIPE PEREZ ARRIETA	andrepe194@gmail.com
1013007571	ELIANA TAPASCO TREJOS	d3982056@gmail.com
1096946039	MARISOL YULIANA SUÁREZ NIÑO	mari.yulisn@gmail.com
1095309044	LUIS SEBASTIAN TORRES DELGADO	delgado304030@gmail.com
52733720	LEIDY JOHANA ACOSTA VARGAS	carolineacosta51@gmail.com
1042856201	KEREN YISELLE SALINAS MENA	yisellemena3456@gmail.com
1104821350	VALENTINA PEÑARANDA AGUDELO	valentinapenarandaagudelo@gmail.com
1127049684	MICHELL SANCHEZ DURAN	michellfer611@gmail.com
1142919497	NAHOMI KAOTY RINCON NAVARRO	rinconnavarronahomikaoty@gmail.com
1146534297	JUAN CAMILO PETRO MONTERROSA	pcami747@gmail.com
1080692743	JENNIFER NATHALY GUERRERO GETIAL	jennifergetial72@gmail.com
1029665464	SHARITH NIKOL BARREIRO RIAÑO	sharith.nikol000@gmail.com
1089176665	KAROL VALENTINA VILLARREAL ROSERO	villarrealrserok@gmail.com
1105393085	KAROL TATIANA NEGRETE MELENDREZ	karolnegrete035@gmail.com
1097397092	MARIA VALENTINA VELA HERRERA	valentinavela447@gmail.com
1095308056	JUAN JOSE QUINCHIA GÓMEZ	juanquinchia26@gmail.com
1080053289	SOFIA RENGIFO ORDOÑEZ	rengifosofia10@gmail.com
1085926779	DANIEL SEBASTIAN RIASCOS MORENO	danielsebastianriascosmoreno@gmail.com
1112050309	ISABEL GAMBOA TROCHEZ	gamboasanchezisabel@gmail.com
1061738331	SERGIO IVAN RIVERA QUISOBONI	sirq534@gmail.com
1003951118	SARA HELENA MORRIS GARCIA	sarahelenamorris@gmail.com
1059241156	DUVAN ESTEVAN BUITRON SAMBONI	estebanbuitron051@gmail.com
1111481971	JOSÉ JOAQUÍN CARLOSAMA VALLEJO	josecarlosama17v@gmail.com
1077857870	NICOL MARIANA CALDERÓN CEDIEL	nikolmarianacediel@gmail.com
1087415219	ANGIE CAROLINA BRAVO CARATAR	angiecarolinabravo@gmail.com
1068139247	LUNA CELESTE GARCÍA SALGADO	lunag6724654@gmail.com
1033735235	TOMAS FELIPE VELASQUEZ CHAPARRO	tomasvelasquez747@gmail.com
1058934104	EMMANUEL CASTRO ZUÑIGA	emmanuelcastro201912@gmail.com
1019065701	SHARID JULIANA PEÑA MARTINEZ	penaj23.11.09@gmail.com
1022982649	SARAY VALENTINA FONTALVO SANTIZ	saryvalentina72@gmail.com
1080053433	NATHALIA SOFIA BASANTE BASANTE	nathr33333@gmail.com
1089606880	MANUELA ISAZA MORALES	misazamorales@gmail.com
1104379631	YULIANA SOFIA ARROYO CACERES	yulianaarroyocaceres@gmail.com
1099207339	ESTEBAN CASTELLANOS GOMEZ	yuliancas08@gmail.com
1069724418	EILEEN JOYCE PÉREZ ESPINOSA	jxoyce.pe@gmail.com
1101688501	LUCIANA ANDREA RODRIGUEZ CASTELLANOS	lucianandrea2408@gmail.com
1029400429	LILY TATIANA RODRÍGUEZ NONTOA	tr254095@gmail.com
1088157493	DANNY FELIPE CAIPE ESPINOSA	felipec1088@gmail.com
1093760224	SHARIK SAMIRA ALBARRACIN CHIA	shariksamir012009@gmail.com
1123438444	JEYDI YERALDIN RIAÑO MARTINEZ	yeraldinriano094@gmail.com
1043307707	VALERYS SALCEDO MUNOZ	valeryssalcedomunoz5@gmail.com
1033105351	LAURA SOFIA BUITRAGO RAMOS	laurita00sof@gmail.com
1089511979	JUAN MIGUEL GUERRERO TENORIO	migueljuanguerrerot@gmail.com
1110366401	ALEJANDRO VASQUEZ MOLINA	alejandro.vasquez.molina@correounivalle.edu.co
1097782189	JOAN SEBASTIAN SANCHEZ CARRILLO	danksta043@gmail.com
1104942721	EILEEN DAYANA RODRIGUEZ RODRIGUEZ	eileen.rdv@gmail.com
1080693742	FANYER SANTIAGO FIGUEROA CUAICAL	fanyersantiagofigueroacuaical@iemciudaddepasto.edu.co
5986576	VICTOR MANUEL GARAVITO GONZÁLEZ	gonzalesbiktor@gmail.com
1109548599	MARIA DE LOS ANGELES GÓMEZ CEBALLOS	angelesgomez2831@gmail.com"""

def main():
    # Rutas
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    auth_index_path = os.path.join(base_dir, 'reportes-sg-next', 'public', 'data', 'auth_index.json')
    
    # Cargar auth_index existente
    with open(auth_index_path, 'r', encoding='utf-8') as f:
        auth_index = json.load(f)
    
    print(f"📍 Auth index actual: {len(auth_index)} estudiantes")
    
    # Crear set de IDs existentes para evitar duplicados
    existing_ids = set(entry['i'] for entry in auth_index)
    existing_emails = set(entry['e'].lower() for entry in auth_index)
    
    # Parsear nuevos estudiantes
    nuevos = []
    for line in NUEVOS_ESTUDIANTES.strip().split('\n'):
        parts = line.split('\t')
        if len(parts) >= 3:
            id_num = parts[0].strip()
            nombre = parts[1].strip()
            email = parts[2].strip()
            
            if id_num and nombre and email:
                nuevos.append({
                    'e': email,
                    'i': id_num,
                    'n': f"SG - {nombre}"
                })
    
    print(f"📝 Nuevos estudiantes a agregar: {len(nuevos)}")
    
    # Agregar solo los que no existen
    agregados = 0
    actualizados = 0
    for nuevo in nuevos:
        email_lower = nuevo['e'].lower()
        
        # Verificar si ya existe por email
        if email_lower in existing_emails:
            print(f"⏭️  Email ya existe: {nuevo['e']}")
            continue
        
        # Verificar si ya existe por ID
        if nuevo['i'] in existing_ids:
            # Actualizar el email del existente
            for entry in auth_index:
                if entry['i'] == nuevo['i']:
                    old_email = entry['e']
                    entry['e'] = nuevo['e']
                    print(f"🔄 Actualizado {nuevo['i']}: {old_email} → {nuevo['e']}")
                    actualizados += 1
                    break
        else:
            # Agregar nuevo
            auth_index.append(nuevo)
            existing_ids.add(nuevo['i'])
            existing_emails.add(email_lower)
            agregados += 1
            print(f"✅ Agregado: {nuevo['n']} ({nuevo['e']})")
    
    # Guardar
    with open(auth_index_path, 'w', encoding='utf-8') as f:
        json.dump(auth_index, f, ensure_ascii=False, separators=(',', ':'))
    
    print(f"\n🎉 RESULTADO:")
    print(f"   - Agregados nuevos: {agregados}")
    print(f"   - Actualizados: {actualizados}")
    print(f"   - Total en auth_index: {len(auth_index)}")

if __name__ == '__main__':
    main()
