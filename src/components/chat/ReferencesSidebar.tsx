import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { BookOpen, Scale } from "lucide-react";

interface ReferencesSidebarProps {
  references: string[];
}

const ReferencesSidebar = ({ references }: ReferencesSidebarProps) => {
  return (
    <aside className="w-80 border-l border-border bg-card flex flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Scale className="w-5 h-5 text-primary" />
          References & Judgements
        </h2>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        {references.length > 0 ? (
          <div className="space-y-3">
            {references.map((ref, index) => (
              <Card key={index} className="p-3 border-primary/20">
                <div className="flex items-start gap-2">
                  <BookOpen className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                  <p className="text-sm">{ref}</p>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-center text-muted-foreground">
            <div className="space-y-2">
              <BookOpen className="w-12 h-12 mx-auto opacity-20" />
              <p className="text-sm">
                References and relevant judgements will appear here during conversations
              </p>
            </div>
          </div>
        )}
      </ScrollArea>
    </aside>
  );
};

export default ReferencesSidebar;