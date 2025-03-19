import { HelpCircle, BellIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  title: string;
}

const Header = ({ title }: HeaderProps) => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="flex items-center justify-between px-6 py-3">
        <h1 className="text-xl font-semibold">{title}</h1>
        <div className="flex items-center gap-3">
          {/*<Button variant="ghost" size="icon">
            <HelpCircle className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <BellIcon className="h-5 w-5" />
          </Button>*/}
        </div>
      </div>
    </header>
  );
};

export default Header;
