import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { getQueryFn } from "@/lib/queryClient";
import { MoveEstimate } from "@shared/schema";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Loader2, MapPin, Calendar, Package, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

export function UserProfile() {
  const { user, logoutMutation } = useAuth();
  
  const { 
    data: estimates, 
    isLoading: estimatesLoading,
    isError
  } = useQuery<MoveEstimate[]>({
    queryKey: ["/api/my-estimates"],
    queryFn: getQueryFn(),
    enabled: !!user,
  });

  if (!user) return null;

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Welcome, {user.username}!</h2>
          <p className="text-muted-foreground">Manage your moving estimates</p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleLogout} 
          disabled={logoutMutation.isPending}
        >
          {logoutMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Logging out...
            </>
          ) : (
            "Logout"
          )}
        </Button>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Your Saved Estimates</h3>
        
        {estimatesLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : isError ? (
          <Card className="bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-600">There was an error loading your estimates. Please try again later.</p>
            </CardContent>
          </Card>
        ) : estimates && estimates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {estimates.map((estimate) => (
              <EstimateCard key={estimate.id} estimate={estimate} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                You don't have any saved estimates yet. Try creating one by calculating a move!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function EstimateCard({ estimate }: { estimate: MoveEstimate }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">
            <div className="flex items-center gap-1 text-primary">
              <MapPin className="h-4 w-4" />
              {estimate.origin.split(',')[0]}
              <ArrowRight className="h-3 w-3 mx-1" />
              {estimate.destination.split(',')[0]}
            </div>
          </CardTitle>
          <Badge variant="outline">
            {estimate.distance} miles
          </Badge>
        </div>
        <CardDescription className="flex items-center gap-1 mt-1">
          <Calendar className="h-3 w-3" />
          Moving on {estimate.moveDate}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="grid grid-cols-3 gap-2 mb-3">
          <PricingItem label="DIY" price={estimate.costDiy} />
          <PricingItem label="Hybrid" price={estimate.costHybrid} />
          <PricingItem label="Full Service" price={estimate.costFullService} />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Package className="h-3 w-3" />
          <span>{estimate.homeSize} home</span>
          {estimate.additionalItems !== 'none' && (
            <Badge variant="secondary" className="text-xs">
              {estimate.additionalItems}
            </Badge>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-1 text-xs text-muted-foreground border-t">
        Created {formatDate(estimate.createdAt)}
      </CardFooter>
    </Card>
  );
}

function PricingItem({ label, price }: { label: string; price: number }) {
  return (
    <div className="text-center p-1 rounded bg-muted/50">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="font-semibold">
        ${price.toLocaleString()}
      </div>
    </div>
  );
}

function formatDate(dateString: string) {
  try {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (e) {
    return dateString;
  }
}