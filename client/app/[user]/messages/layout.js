export default function RootLayout({ children }) {
    return (
        <>
            <div className='max-w-[1024px] mx-auto rounded-xl mt-5 pb-5 relative flex flex-col'>
                {children}
            </div>
        </>
    );
}

export const metadata = {
    title: "Messages - Next Chat App",
    description: "Generated by create next app",
};