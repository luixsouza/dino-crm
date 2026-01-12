import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  CheckSquare,
  Settings,
  LogOut,
  Calendar,
  Scissors,
  ClipboardList,
  DollarSign,
  Package,
  Briefcase, // or UserCog
} from 'lucide-react';

const navItems = [
  { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/pipeline', icon: Calendar, label: 'Funil' },
  { href: '/appointments', icon: Scissors, label: 'Agendamentos' },
  { href: '/leads', icon: Users, label: 'Clientes' },
  { href: '/orders', icon: ClipboardList, label: 'Comandas' },
  { href: '/products', icon: Package, label: 'Produtos' },
  { href: '/employees', icon: Briefcase, label: 'Equipe' },
  { href: '/finance', icon: DollarSign, label: 'Financeiro' },
  { href: '/chat', icon: MessageSquare, label: 'Chat Bot' },
  { href: '/tasks', icon: CheckSquare, label: 'Tarefas' },
];

export function Sidebar() {
  const location = useLocation();
  const { profile, signOut } = useAuth();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <aside className="w-64 border-r border-border bg-sidebar flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <img src="/dino-png.png" alt="Dino CRM" className="h-10 w-10 object-contain" />
          <h1 className="text-xl font-bold text-sidebar-foreground">Dino CRM</h1>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Barbearia Seu Dino</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {profile?.name ? getInitials(profile.name) : 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {profile?.name || 'Usuário'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {profile?.email}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="flex-1 justify-start" asChild>
            <Link to="/settings">
              <Settings className="h-4 w-4 mr-2" />
              Config
            </Link>
          </Button>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
