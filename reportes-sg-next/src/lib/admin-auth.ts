
// Lista de correos administradores
export const ADMIN_EMAILS = [
    "seamosgenios.calidad@gmail.com",
    "seamosgenios.direccion@gmail.com",
    "daniel.developer@example.com" // Placeholder, replace with actual
];

export const isAdmin = (email: string | null | undefined): boolean => {
    if (!email) return false;
    return ADMIN_EMAILS.includes(email.toLowerCase());
};
