import { Button } from '@/components/ui/button';
import { Scissors, Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

export function Header() {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-background/95 backdrop-blur-md border-b border-border shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Scissors className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xl font-display font-bold text-gold-gradient">
              BarberPro Prime
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <button
              onClick={() => scrollToSection('features')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Funcionalidades
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Como Funciona
            </button>
            <button
              onClick={() => scrollToSection('pricing')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Preços
            </button>
            <button
              onClick={() => scrollToSection('faq')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              FAQ
            </button>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/login')}>
              Entrar
            </Button>
            <Button 
              onClick={() => navigate('/login?tab=signup')}
              className="bg-gradient-to-r from-primary to-amber-500 hover:from-primary/90 hover:to-amber-500/90"
            >
              Teste Grátis 7 Dias
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <nav className="flex flex-col gap-4">
              <button
                onClick={() => scrollToSection('features')}
                className="text-left py-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                Funcionalidades
              </button>
              <button
                onClick={() => scrollToSection('how-it-works')}
                className="text-left py-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                Como Funciona
              </button>
              <button
                onClick={() => scrollToSection('pricing')}
                className="text-left py-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                Preços
              </button>
              <button
                onClick={() => scrollToSection('faq')}
                className="text-left py-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                FAQ
              </button>
              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                <Button variant="outline" onClick={() => navigate('/login')}>
                  Entrar
                </Button>
                <Button 
                  onClick={() => navigate('/login?tab=signup')}
                  className="bg-gradient-to-r from-primary to-amber-500"
                >
                  Teste Grátis 7 Dias
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
