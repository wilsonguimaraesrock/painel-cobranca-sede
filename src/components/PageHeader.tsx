
import { LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

interface PageHeaderProps {
  title: string;
}

const PageHeader = ({ title }: PageHeaderProps) => {
  const { username, logout } = useAuth();

  return (
    <div className="w-full bg-primary text-primary-foreground py-4 mb-4 rounded-md shadow-md">
      <div className="flex justify-between items-center px-4">
        <h1 className="text-2xl font-bold">{title}</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm">
            {username ? `${username}` : 'Usuário não identificado'}
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-white hover:bg-gray-100 text-primary"
            onClick={logout}
          >
            <LogOut className="h-4 w-4 mr-1" />
            Sair
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PageHeader;
