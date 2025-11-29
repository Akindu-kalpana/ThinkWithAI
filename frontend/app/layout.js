import "./globals.css";

export const metadata = {
  title: "ThinkWithAI",
  description: "Learn actively with AI guidance",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}