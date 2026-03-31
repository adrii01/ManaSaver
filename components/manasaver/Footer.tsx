export function Footer() {
  return (
    <footer className="border-t border-border mt-8">
      <div className="mx-auto max-w-4xl px-4 py-6">
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-primary/60" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C12 2 5 10.5 5 14.5C5 18.09 8.13 21 12 21C15.87 21 19 18.09 19 14.5C19 10.5 12 2 12 2Z" />
            </svg>
            <span>Powered by <span className="text-primary font-semibold">ManaSaver</span> &copy; 2026</span>
          </div>
          <nav className="flex items-center gap-4">
            {["Privacy", "Terms", "Help", "API"].map(link => (
              <a
                key={link}
                href="#"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {link}
              </a>
            ))}
          </nav>
        </div>
        <p className="mt-3 text-center text-[10px] text-muted-foreground/50">
          ManaSaver is not affiliated with Cardmarket or Wizards of the Coast. All prices are indicative.
        </p>
      </div>
    </footer>
  )
}
