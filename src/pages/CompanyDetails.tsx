import { Building2 } from "lucide-react";

import { Badge } from "@/components/ui/Badge";

export function CompanyDetails() {
  return (
    <div className="p-6">
      <div className="text-center py-20">
        <Building2 className="h-16 w-16 mx-auto mb-6 text-muted-foreground" />
        <h1 className="text-3xl font-bold mb-4">Company Details</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Detailed company profiles and analytics coming soon.
        </p>
        <Badge variant="outline" className="mt-4">
          Coming Soon
        </Badge>
      </div>
    </div>
  );
}
export default CompanyDetails;
