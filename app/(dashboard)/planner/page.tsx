import PlannerApp from "@/components/PlannerApp";
import ErrorBoundary from "@/components/ErrorBoundary";

export default function PlannerPage() {
  return (
    <ErrorBoundary>
      <PlannerApp />
    </ErrorBoundary>
  );
}
