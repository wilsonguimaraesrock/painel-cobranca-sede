
import UserStatus from "@/components/UserStatus";

interface PageHeaderProps {
  title: string;
}

const PageHeader = ({ title }: PageHeaderProps) => {
  return (
    <div className="w-full bg-primary text-primary-foreground py-4 mb-4 rounded-md shadow-md">
      <div className="flex justify-between items-center px-4">
        <h1 className="text-3xl font-bold">{title}</h1>
        <UserStatus />
      </div>
    </div>
  );
};

export default PageHeader;
