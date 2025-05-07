import { FileText } from 'lucide-react';
import Link from 'next/link';

const Logo = ({ className = "" }: { className?: string }) => {
  return (
    <Link href="/" className={`flex items-center gap-2 text-xl font-semibold ${className}`}>
      <FileText className="h-7 w-7 text-primary" />
      <span>Report-Manager Lite</span>
    </Link>
  );
};

export default Logo;
