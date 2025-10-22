import { Button } from "@/components/ui/button";
import { Scale } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background via-secondary to-background p-4">
      <div className="text-center space-y-6 max-w-2xl">
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-primary rounded-full">
            <Scale className="w-16 h-16 text-primary-foreground" />
          </div>
        </div>
        <h1 className="text-5xl font-bold text-primary mb-4">LegalAI Advisor</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Your intelligent legal assistant powered by AI. Get instant legal guidance, analyze documents, and explore relevant case laws.
        </p>
        <div className="flex gap-4 justify-center">
          <Button size="lg" onClick={() => navigate("/auth")}>
            Get Started
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate("/auth")}>
            Sign In
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
