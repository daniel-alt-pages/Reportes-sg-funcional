
// Lista de correos administradores
export const ADMIN_EMAILS = [
    "danielff999gf@gmail.com",
    "seamosgenios@adpmh.com",
    "adm.seamosgenios@gmail.com"
];

export const isAdmin = (email: string | null | undefined): boolean => {
    if (!email) return false;
    return ADMIN_EMAILS.includes(email.toLowerCase());
};
