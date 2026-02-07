import SecureSession from "@/components/SecureSession";

export default function EstudianteLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <SecureSession />
            {children}
        </>
    );
}
