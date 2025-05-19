
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { User } from "lucide-react";

const UserStatus = () => {
  const { username, logout } = useAuth();
  
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center text-sm text-primary-foreground">
        <User size={16} className="mr-1" />
        <span>{username}</span>
      </div>
      <Button variant="outline" size="sm" onClick={logout} className="bg-transparent text-primary-foreground border-primary-foreground hover:bg-primary-foreground/10">
        Sair
      </Button>
    </div>
  );
};

export default UserStatus;
