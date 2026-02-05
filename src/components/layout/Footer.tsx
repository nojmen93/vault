export function Footer(): React.ReactElement {
  return (
    <footer className="border-t py-4 text-center text-sm text-muted-foreground">
      <p>&copy; {new Date().getFullYear()} Vault. All rights reserved.</p>
    </footer>
  );
}
