import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Clock, Calendar as CalendarIcon2, CheckCircle, CheckSquare, FileCheck, Settings, Tag, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

// Define types for checklist and checklist items
type Checklist = {
  id: number;
  userId: number;
  estimateId: number | null;
  moveDate: string;
  createdAt: string;
};

type ChecklistItem = {
  id: number;
  checklistId: number;
  task: string;
  description: string | null;
  category: string;
  timeframe: string;
  completed: boolean;
  createdAt: string;
};

type TimeframeItem = {
  label: string;
  value: string;
  order: number;
};

export function MovingChecklist({ estimateId }: { estimateId?: number }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [activeTab, setActiveTab] = useState('all');

  // Query to get checklists
  const { data: checklists, isLoading: checklistsLoading } = useQuery<Checklist[]>({
    queryKey: ['/api/checklists'],
    enabled: !!user,
  });

  // Selected checklist ID (first one by default, or the one related to the estimate)
  const [selectedChecklistId, setSelectedChecklistId] = useState<number | null>(null);

  // Set the selected checklist once data is loaded
  React.useEffect(() => {
    if (checklists && checklists.length > 0) {
      if (estimateId) {
        // Find checklist related to the estimate
        const relatedChecklist = checklists.find(c => c.estimateId === estimateId);
        if (relatedChecklist) {
          setSelectedChecklistId(relatedChecklist.id);
          return;
        }
      }
      // Default to first checklist if none is related to the estimate
      setSelectedChecklistId(checklists[0].id);
    }
  }, [checklists, estimateId]);

  // Query to get checklist items for the selected checklist
  const { data: checklistData, isLoading: itemsLoading } = useQuery<{ checklist: Checklist, items: ChecklistItem[] }>({
    queryKey: ['/api/checklists', selectedChecklistId],
    enabled: !!selectedChecklistId,
  });

  // Mutation to create a new checklist
  const createChecklistMutation = useMutation({
    mutationFn: async (data: { moveDate: string, estimateId?: number }) => {
      const res = await apiRequest('POST', '/api/checklists', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/checklists'] });
      toast({
        title: 'Checklist created',
        description: 'Your moving checklist has been created successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error creating checklist',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation to update a checklist item (mark as complete/incomplete)
  const updateItemMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: number, completed: boolean }) => {
      const res = await apiRequest('PATCH', `/api/checklist-items/${id}`, { completed });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/checklists', selectedChecklistId] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating item',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Handle creating a new checklist
  const handleCreateChecklist = () => {
    if (!selectedDate) {
      toast({
        title: 'Please select a move date',
        variant: 'destructive',
      });
      return;
    }

    createChecklistMutation.mutate({
      moveDate: format(selectedDate, 'yyyy-MM-dd'),
      estimateId: estimateId,
    });
  };

  // Handle toggling item completion status
  const handleToggleItem = (id: number, currentStatus: boolean) => {
    updateItemMutation.mutate({ id, completed: !currentStatus });
  };

  // Define timeframes for filtering and ordering
  const timeframes: TimeframeItem[] = [
    { label: '8 Weeks Before', value: '8-weeks', order: 1 },
    { label: '4 Weeks Before', value: '4-weeks', order: 2 },
    { label: '2 Weeks Before', value: '2-weeks', order: 3 },
    { label: '1 Week Before', value: '1-week', order: 4 },
    { label: 'Moving Day', value: 'moving-day', order: 5 },
    { label: 'After Moving', value: 'after-move', order: 6 },
  ];

  // Filter and sort items based on active tab
  const filteredItems = React.useMemo(() => {
    if (!checklistData?.items) return [];
    
    let items = [...checklistData.items];
    
    // Filter by timeframe if not 'all'
    if (activeTab !== 'all') {
      items = items.filter(item => item.timeframe === activeTab);
    }
    
    // Sort by timeframe order, then by completion status
    return items.sort((a, b) => {
      const aTimeframe = timeframes.find(t => t.value === a.timeframe)?.order || 99;
      const bTimeframe = timeframes.find(t => t.value === b.timeframe)?.order || 99;
      
      if (aTimeframe !== bTimeframe) return aTimeframe - bTimeframe;
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return 0;
    });
  }, [checklistData, activeTab]);

  // Get completion statistics
  const stats = React.useMemo(() => {
    if (!checklistData?.items) return { total: 0, completed: 0, percentage: 0 };
    
    const total = checklistData.items.length;
    const completed = checklistData.items.filter(item => item.completed).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { total, completed, percentage };
  }, [checklistData]);

  // Render create checklist view if no checklists exist
  if (!checklistsLoading && (!checklists || checklists.length === 0)) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Create Your Moving Checklist</CardTitle>
          <CardDescription>
            Set up a personalized checklist to help you organize your move
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">When is your move date?</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, 'PPP')
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                  disabled={(date) => date < new Date()} // Can't select dates in the past
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleCreateChecklist} 
            disabled={!selectedDate || createChecklistMutation.isPending}
            className="w-full"
          >
            {createChecklistMutation.isPending ? 'Creating...' : 'Create Moving Checklist'}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Loading state
  if (checklistsLoading || (selectedChecklistId && itemsLoading)) {
    return <div className="flex justify-center p-8">Loading checklist...</div>;
  }

  // Render checklist view
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Moving Checklist</CardTitle>
            <CardDescription>
              {checklistData?.checklist && (
                <span>Moving on {format(new Date(checklistData.checklist.moveDate), 'MMMM d, yyyy')}</span>
              )}
            </CardDescription>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm font-medium">Progress</div>
              <div className="text-2xl font-bold">{stats.percentage}%</div>
            </div>
            <div className="h-12 w-12 rounded-full border-4 border-primary flex items-center justify-center">
              <CheckCircle
                className={cn(
                  "h-6 w-6", 
                  stats.percentage === 100 ? "text-primary" : "text-muted-foreground"
                )}
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <div className="pb-3">
            <TabsList className="w-full flex">
              <TabsTrigger value="all" className="flex-1">All Tasks</TabsTrigger>
              {timeframes.map((timeframe) => (
                <TabsTrigger key={timeframe.value} value={timeframe.value} className="flex-1 hidden md:flex">
                  {timeframe.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="all" className="mt-0">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                {filteredItems.map((item) => (
                  <ChecklistItemCard
                    key={item.id}
                    item={item}
                    onToggle={handleToggleItem}
                    timeframeLabel={timeframes.find(t => t.value === item.timeframe)?.label || item.timeframe}
                  />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {timeframes.map((timeframe) => (
            <TabsContent key={timeframe.value} value={timeframe.value} className="mt-0">
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-2">
                  {filteredItems.map((item) => (
                    <ChecklistItemCard
                      key={item.id}
                      item={item}
                      onToggle={handleToggleItem}
                      timeframeLabel={timeframe.label}
                      showTimeframe={false}
                    />
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
      <CardFooter className="border-t pt-4 flex justify-between">
        <div className="text-sm text-muted-foreground">
          {stats.completed} of {stats.total} tasks completed
        </div>
        {checklists && checklists.length > 1 && (
          <select 
            value={selectedChecklistId || ''} 
            onChange={(e) => setSelectedChecklistId(Number(e.target.value))}
            className="text-sm border rounded p-1"
          >
            {checklists.map(checklist => (
              <option key={checklist.id} value={checklist.id}>
                Move on {format(new Date(checklist.moveDate), 'MMM d, yyyy')}
              </option>
            ))}
          </select>
        )}
      </CardFooter>
    </Card>
  );
}

// Component for displaying an individual checklist item
function ChecklistItemCard({ 
  item, 
  onToggle, 
  timeframeLabel,
  showTimeframe = true
}: { 
  item: ChecklistItem; 
  onToggle: (id: number, currentStatus: boolean) => void; 
  timeframeLabel: string;
  showTimeframe?: boolean;
}) {
  // Map categories to icons
  const categoryIcons: Record<string, React.ReactNode> = {
    planning: <Settings className="h-4 w-4" />,
    packing: <CheckSquare className="h-4 w-4" />,
    admin: <FileCheck className="h-4 w-4" />,
    cleaning: <FileCheck className="h-4 w-4" />,
    "moving-day": <MapPin className="h-4 w-4" />,
    unpacking: <CheckSquare className="h-4 w-4" />,
    "settling-in": <MapPin className="h-4 w-4" />,
  };

  return (
    <div className={cn(
      "border rounded-lg p-3", 
      item.completed ? "border-muted bg-muted/30" : "border-accent"
    )}>
      <div className="flex items-start gap-3">
        <Checkbox 
          checked={item.completed}
          onCheckedChange={() => onToggle(item.id, item.completed)}
          className="mt-1"
        />
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <h4 className={cn(
              "font-medium", 
              item.completed && "line-through text-muted-foreground"
            )}>
              {item.task}
            </h4>
          </div>
          {item.description && (
            <p className={cn(
              "text-sm", 
              item.completed ? "text-muted-foreground" : "text-foreground/80"
            )}>
              {item.description}
            </p>
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            {showTimeframe && (
              <Badge variant="outline" className="flex items-center gap-1 text-xs">
                <Clock className="h-3 w-3" />
                {timeframeLabel}
              </Badge>
            )}
            <Badge variant="secondary" className="flex items-center gap-1 text-xs">
              {categoryIcons[item.category] || <Tag className="h-3 w-3" />}
              {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}