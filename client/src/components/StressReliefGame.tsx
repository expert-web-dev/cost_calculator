import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Award, Gift, Smile, Heart, Coffee, Home, Music, Box, CheckCircle, Star, Crown, Medal } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { AnimatePresence, motion } from 'framer-motion';
import confetti from 'canvas-confetti';

// Types for our gamification elements
interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  unlocked: boolean;
  points: number;
}

interface Tip {
  id: string;
  title: string;
  content: string;
  icon: React.ReactNode;
  category: 'mindfulness' | 'productivity' | 'selfCare' | 'fun';
}

interface MiniGame {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  component: React.ReactNode;
}

interface UserProgress {
  points: number;
  level: number;
  achievements: string[]; // IDs of unlocked achievements
  streak: number; // Days in a row user has engaged
  lastInteraction: string; // ISO date string
}

export function StressReliefGame() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // State for the various parts of our gamification system
  const [userProgress, setUserProgress] = useState<UserProgress>({
    points: 0,
    level: 1,
    achievements: [],
    streak: 0,
    lastInteraction: new Date().toISOString(),
  });
  
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Fetch user progress data using our implemented API
  const { data: progressData, isLoading: progressLoading } = useQuery<UserProgress>({
    queryKey: ['/api/user-progress'],
    enabled: !!user, // Only run if user is logged in
  });
  
  // Mutation for updating user progress
  const updateProgressMutation = useMutation({
    mutationFn: async (data: Partial<UserProgress>) => {
      const res = await apiRequest('PATCH', '/api/user-progress', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-progress'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating progress",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Mutation for unlocking achievements
  const unlockAchievementMutation = useMutation({
    mutationFn: async ({ achievementId, points }: { achievementId: string, points: number }) => {
      const res = await apiRequest('POST', '/api/unlock-achievement', { achievementId, points });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-progress'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error unlocking achievement",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Update local state when data is loaded
  useEffect(() => {
    if (progressData) {
      setUserProgress(progressData);
    }
  }, [progressData]);
  
  // Check and update streak
  useEffect(() => {
    if (!user) return;
    
    const checkStreak = () => {
      const lastDate = new Date(userProgress.lastInteraction);
      const today = new Date();
      
      // Check if last interaction was yesterday or today
      const oneDayMs = 24 * 60 * 60 * 1000;
      const dayDifference = Math.floor((today.getTime() - lastDate.getTime()) / oneDayMs);
      
      let newStreak = userProgress.streak;
      let updated = false;
      
      if (dayDifference === 1 || dayDifference === 0) {
        // If last interaction was yesterday or today and we haven't already counted today
        const lastDateStr = lastDate.toDateString();
        const todayStr = today.toDateString();
        
        if (lastDateStr !== todayStr) {
          newStreak += 1;
          updated = true;
        }
      } else if (dayDifference > 1) {
        // Streak broken
        newStreak = 1;
        updated = true;
      }
      
      if (updated) {
        const updatedProgress = {
          ...userProgress,
          streak: newStreak,
          lastInteraction: today.toISOString(),
        };
        
        setUserProgress(updatedProgress);
        updateProgressMutation.mutate(updatedProgress);
      }
    };
    
    checkStreak();
  }, [user]);
  
  // List of achievements
  const achievements: Achievement[] = [
    {
      id: 'complete_profile',
      title: 'Profile Master',
      description: 'Complete your user profile',
      icon: <Home className="w-6 h-6 text-blue-500" />,
      unlocked: userProgress.achievements.includes('complete_profile'),
      points: 10,
    },
    {
      id: 'first_estimate',
      title: 'Cost Explorer',
      description: 'Create your first moving cost estimate',
      icon: <Box className="w-6 h-6 text-green-500" />,
      unlocked: userProgress.achievements.includes('first_estimate'),
      points: 15,
    },
    {
      id: 'first_checklist',
      title: 'Organizer',
      description: 'Create your first moving checklist',
      icon: <CheckCircle className="w-6 h-6 text-purple-500" />,
      unlocked: userProgress.achievements.includes('first_checklist'),
      points: 15,
    },
    {
      id: 'streak_3',
      title: 'Consistency Champion',
      description: 'Visit the app 3 days in a row',
      icon: <Star className="w-6 h-6 text-yellow-500" />,
      unlocked: userProgress.streak >= 3,
      points: 20,
    },
    {
      id: 'streak_7',
      title: 'Week Warrior',
      description: 'Visit the app 7 days in a row',
      icon: <Crown className="w-6 h-6 text-amber-500" />,
      unlocked: userProgress.streak >= 7,
      points: 50,
    },
    {
      id: 'complete_5_tasks',
      title: 'Task Master',
      description: 'Complete 5 tasks from your moving checklist',
      icon: <Medal className="w-6 h-6 text-red-500" />,
      unlocked: userProgress.achievements.includes('complete_5_tasks'),
      points: 25,
    },
  ];
  
  // Stress reduction tips
  const tips: Tip[] = [
    {
      id: 'mindful_breathing',
      title: 'Mindful Breathing',
      content: 'Take 5 deep breaths, counting to 4 as you inhale and to 6 as you exhale. Focus only on your breath.',
      icon: <Heart className="w-6 h-6 text-red-500" />,
      category: 'mindfulness',
    },
    {
      id: 'box_labeling',
      title: 'Box Labeling Strategy',
      content: 'Use colored tape to color-code boxes by room. Take photos of box contents before sealing them.',
      icon: <Box className="w-6 h-6 text-amber-500" />,
      category: 'productivity',
    },
    {
      id: 'moving_playlist',
      title: 'Create a Moving Playlist',
      content: 'Make an energetic playlist to keep you motivated during packing and moving day.',
      icon: <Music className="w-6 h-6 text-indigo-500" />,
      category: 'fun',
    },
    {
      id: 'take_breaks',
      title: 'Schedule Regular Breaks',
      content: 'Set a timer for 50 minutes of work followed by a 10-minute break to prevent burnout.',
      icon: <Coffee className="w-6 h-6 text-brown-500" />,
      category: 'selfCare',
    },
  ];
  
  // Function to unlock an achievement
  const unlockAchievement = (achievementId: string) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to track achievements and progress.",
        variant: "default",
      });
      return;
    }
    
    if (userProgress.achievements.includes(achievementId)) {
      toast({
        title: "Achievement already unlocked",
        description: "You've already earned this achievement.",
        variant: "default",
      });
      return;
    }
    
    const achievement = achievements.find(a => a.id === achievementId);
    if (!achievement) return;
    
    // Use our new achievement unlock API
    unlockAchievementMutation.mutate(
      { achievementId, points: achievement.points },
      {
        onSuccess: (data) => {
          // Show achievement notification
          toast({
            title: `Achievement Unlocked: ${achievement.title}`,
            description: `${achievement.description} (+${achievement.points} points)`,
            variant: "default",
          });
          
          // Check if user leveled up
          if (data.progress && data.progress.level > userProgress.level) {
            toast({
              title: `Level Up! You're now level ${data.progress.level}`,
              description: "Keep going! You're making great progress.",
              variant: "default", 
            });
            
            // Trigger confetti effect
            triggerConfetti();
          }
        }
      }
    );
  };
  
  // Function to trigger confetti celebration
  const triggerConfetti = () => {
    setShowConfetti(true);
    
    // Using canvas-confetti
    const duration = 3 * 1000;
    const end = Date.now() + duration;
    
    const colors = ['#4F46E5', '#8B5CF6', '#EC4899', '#10B981'];
    
    (function frame() {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      });
      
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      });
      
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
    
    // Remove confetti flag after animation
    setTimeout(() => {
      setShowConfetti(false);
    }, duration);
  };
  
  // Deep Breathing Mini-Game Component
  const DeepBreathingGame = () => {
    const [breathingPhase, setBreathingPhase] = useState<'inhale' | 'hold' | 'exhale' | 'rest'>('rest');
    const [timerSeconds, setTimerSeconds] = useState(0);
    const [sessionComplete, setSessionComplete] = useState(false);
    const [cycles, setCycles] = useState(0);
    
    const startBreathing = () => {
      setBreathingPhase('inhale');
      setTimerSeconds(4);
      setCycles(0);
      setSessionComplete(false);
    };
    
    useEffect(() => {
      if (breathingPhase === 'rest' || sessionComplete) return;
      
      const timer = setInterval(() => {
        if (timerSeconds > 1) {
          setTimerSeconds(prev => prev - 1);
        } else {
          // Move to next phase
          if (breathingPhase === 'inhale') {
            setBreathingPhase('hold');
            setTimerSeconds(4);
          } else if (breathingPhase === 'hold') {
            setBreathingPhase('exhale');
            setTimerSeconds(6);
          } else if (breathingPhase === 'exhale') {
            setCycles(prev => prev + 1);
            
            if (cycles >= 4) {
              setSessionComplete(true);
              setBreathingPhase('rest');
              
              // Award points for completing the exercise
              const updatedProgress = {
                ...userProgress,
                points: userProgress.points + 5,
              };
              setUserProgress(updatedProgress);
              updateProgressMutation.mutate(updatedProgress);
              
              toast({
                title: "Exercise Complete",
                description: "Great job! You've earned 5 points for reducing stress.",
                variant: "default",
              });
              
              // Check if this unlocked any achievements
              if (!userProgress.achievements.includes('breathing_master') && cycles >= 4) {
                unlockAchievement('breathing_master');
              }
            } else {
              setBreathingPhase('inhale');
              setTimerSeconds(4);
            }
          }
        }
      }, 1000);
      
      return () => clearInterval(timer);
    }, [breathingPhase, timerSeconds, cycles]);
    
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Deep Breathing Exercise</CardTitle>
          <CardDescription className="text-center">
            Follow the prompts to complete 5 breathing cycles
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          {breathingPhase === 'rest' ? (
            <Button className="mb-4" onClick={startBreathing}>
              Start Exercise
            </Button>
          ) : (
            <div className="text-center">
              <div className="mb-4">
                <motion.div
                  animate={{
                    scale: breathingPhase === 'inhale' ? 1.5 : breathingPhase === 'exhale' ? 0.8 : 1.2,
                    opacity: 1,
                  }}
                  transition={{ duration: breathingPhase === 'inhale' ? 4 : breathingPhase === 'exhale' ? 6 : 4 }}
                  className="w-32 h-32 rounded-full bg-blue-100 flex items-center justify-center mx-auto border-4 border-blue-300"
                >
                  <span className="text-xl font-semibold text-blue-700">{timerSeconds}s</span>
                </motion.div>
              </div>
              <div className="text-lg font-medium mb-2">
                {breathingPhase === 'inhale'
                  ? 'Breathe In'
                  : breathingPhase === 'hold'
                  ? 'Hold'
                  : 'Breathe Out'}
              </div>
              <div className="text-gray-500 mb-4">Cycle: {cycles + 1} / 5</div>
              <Progress value={(cycles / 5) * 100} className="w-full" />
            </div>
          )}
          
          {sessionComplete && (
            <div className="mt-4 text-center">
              <p className="text-green-600 font-semibold mb-2">Great job! Exercise complete.</p>
              <Button onClick={startBreathing}>Do it Again</Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };
  
  // PackingPuzzle Mini-Game Component
  const PackingPuzzle = () => {
    const [packingItems, setPackingItems] = useState([
      { id: 1, name: 'Books', packed: false },
      { id: 2, name: 'Clothes', packed: false },
      { id: 3, name: 'Kitchen Supplies', packed: false },
      { id: 4, name: 'Electronics', packed: false },
      { id: 5, name: 'Bathroom Items', packed: false },
    ]);
    
    const [targetOrder, setTargetOrder] = useState<number[]>([]);
    const [userOrder, setUserOrder] = useState<number[]>([]);
    const [gameStarted, setGameStarted] = useState(false);
    const [gameWon, setGameWon] = useState(false);
    const [attempts, setAttempts] = useState(0);
    
    const startGame = () => {
      // Generate random order for optimal packing
      const indices: number[] = [];
      for (let i = 0; i < packingItems.length; i++) {
        indices.push(i + 1);
      }
      const shuffled = indices.sort(() => Math.random() - 0.5);
      
      setTargetOrder(shuffled);
      setUserOrder([]);
      setGameStarted(true);
      setGameWon(false);
      setAttempts(0);
      
      // Reset packed status
      setPackingItems(packingItems.map(item => ({ ...item, packed: false })));
    };
    
    const handleItemClick = (id: number) => {
      if (!gameStarted || gameWon) return;
      
      // Add item to order if not already packed
      if (!userOrder.includes(id)) {
        const newOrder = [...userOrder, id];
        setUserOrder(newOrder);
        
        // Mark item as packed
        setPackingItems(
          packingItems.map(item => (item.id === id ? { ...item, packed: true } : item))
        );
        
        // Check if all items are packed
        if (newOrder.length === packingItems.length) {
          setAttempts(prev => prev + 1);
          
          // Compare with optimal order
          let score = 0;
          for (let i = 0; i < newOrder.length; i++) {
            if (newOrder[i] === targetOrder[i]) {
              score++;
            }
          }
          
          const efficiency = Math.round((score / packingItems.length) * 100);
          
          if (efficiency >= 70) {
            setGameWon(true);
            
            // Award points based on efficiency
            const pointsEarned = Math.round(10 + (efficiency - 70) / 3);
            
            const updatedProgress = {
              ...userProgress,
              points: userProgress.points + pointsEarned,
            };
            setUserProgress(updatedProgress);
            updateProgressMutation.mutate(updatedProgress);
            
            toast({
              title: `Packing Complete: ${efficiency}% Efficient!`,
              description: `You've earned ${pointsEarned} points for your packing skills.`,
              variant: "default",
            });
            
            if (efficiency === 100 && !userProgress.achievements.includes('perfect_packer')) {
              unlockAchievement('perfect_packer');
            }
          } else {
            toast({
              title: "Not Quite Optimal",
              description: `Your packing was ${efficiency}% efficient. Try a different order!`,
              variant: "default",
            });
            
            // Reset for another attempt
            setUserOrder([]);
            setPackingItems(packingItems.map(item => ({ ...item, packed: false })));
          }
        }
      }
    };
    
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Packing Puzzle</CardTitle>
          <CardDescription className="text-center">
            Find the optimal order to pack your moving boxes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!gameStarted ? (
            <div className="text-center">
              <p className="mb-4">
                In this game, you'll try to find the most efficient order to pack items.
                Items must be packed in a specific sequence for maximum efficiency.
              </p>
              <Button onClick={startGame}>Start Packing</Button>
            </div>
          ) : (
            <div>
              <p className="mb-4 text-center">
                Click items in the order you would pack them. Try to find the most efficient sequence!
              </p>
              
              <div className="grid grid-cols-1 gap-3 mb-4">
                {packingItems.map(item => (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item.id)}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      item.packed
                        ? 'bg-green-100 border-green-400 opacity-50'
                        : 'bg-white border-gray-300 hover:border-blue-500'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span>{item.name}</span>
                      {item.packed && <CheckCircle className="w-5 h-5 text-green-500" />}
                    </div>
                  </div>
                ))}
              </div>
              
              {gameWon ? (
                <div className="text-center">
                  <p className="text-green-600 font-medium mb-2">
                    Congratulations! You found an efficient packing order!
                  </p>
                  <Button onClick={startGame} className="mt-2">
                    Play Again
                  </Button>
                </div>
              ) : (
                attempts > 0 && (
                  <div className="text-center">
                    <p className="text-amber-600 mb-2">Keep trying! Packing order matters.</p>
                    <Progress value={(attempts / 5) * 100} className="w-full mb-2" />
                    <p className="text-sm text-gray-500">Attempts: {attempts}/5</p>
                  </div>
                )
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };
  
  // Mini-games list
  const miniGames = [
    {
      id: 'breathing',
      title: 'Deep Breathing Exercise',
      description: 'Reduce stress with guided breathing patterns',
      icon: <Heart className="w-6 h-6 text-red-500" />,
      component: <DeepBreathingGame />,
    },
    {
      id: 'packing_puzzle',
      title: 'Packing Puzzle',
      description: 'Find the optimal order to pack your items',
      icon: <Box className="w-6 h-6 text-amber-500" />,
      component: <PackingPuzzle />,
    },
  ];
  
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Moving Stress Relief</h2>
        <p className="text-gray-600">
          Games and activities to reduce moving stress while making progress on your move
        </p>
      </div>
      
      {/* User progress section */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle>Your Progress</CardTitle>
            <Badge variant="outline" className="py-1">
              Level {userProgress.level}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-primary text-white rounded-full w-12 h-12 flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">
                  {userProgress.points} / {userProgress.level * 100} points
                </span>
                <span className="text-xs text-gray-500">
                  {userProgress.level * 100 - userProgress.points} points to level {userProgress.level + 1}
                </span>
              </div>
              <Progress value={(userProgress.points % 100)} className="w-full" />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium">Daily Streak</span>
              <div className="flex items-center gap-1">
                <Smile className="w-4 h-4 text-amber-500" />
                <span className="font-semibold">{userProgress.streak} days</span>
              </div>
            </div>
            <div>
              <span className="text-sm font-medium">Achievements</span>
              <div className="flex items-center gap-1">
                <Medal className="w-4 h-4 text-blue-500" />
                <span className="font-semibold">
                  {userProgress.achievements.length} / {achievements.length}
                </span>
              </div>
            </div>
            <div>
              <Button
                variant="ghost"
                size="sm"
                className="text-primary"
                onClick={triggerConfetti}
              >
                <Gift className="w-4 h-4 mr-1" /> Reward Me
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Main content tabs */}
      <Tabs defaultValue="tips">
        <TabsList className="w-full grid grid-cols-3 mb-6">
          <TabsTrigger value="tips">Stress Relief Tips</TabsTrigger>
          <TabsTrigger value="games">Mini-Games</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>
        
        {/* Tips content */}
        <TabsContent value="tips" className="mt-0">
          <div className="grid md:grid-cols-2 gap-4">
            {tips.map(tip => (
              <Card key={tip.id} className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 pb-2">
                  <div className="flex items-center gap-2">
                    {tip.icon}
                    <CardTitle className="text-lg">{tip.title}</CardTitle>
                  </div>
                  <Badge variant="outline">{
                    tip.category === 'mindfulness'
                      ? 'Mindfulness'
                      : tip.category === 'productivity'
                      ? 'Productivity'
                      : tip.category === 'selfCare'
                      ? 'Self-Care'
                      : 'Fun'
                  }</Badge>
                </CardHeader>
                <CardContent className="pt-4">
                  <p>{tip.content}</p>
                </CardContent>
                <CardFooter className="border-t bg-gray-50 flex justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      toast({
                        title: `Tip Applied: ${tip.title}`,
                        description: "Great job! You've earned 1 point for reducing stress.",
                        variant: "default",
                      });
                      
                      const updatedProgress = {
                        ...userProgress,
                        points: userProgress.points + 1,
                      };
                      setUserProgress(updatedProgress);
                      updateProgressMutation.mutate(updatedProgress);
                    }}
                  >
                    I Did This! (+1 pt)
                  </Button>
                  <button className="text-xs text-gray-500">Save for Later</button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        {/* Games content */}
        <TabsContent value="games" className="mt-0">
          {selectedGame ? (
            <div>
              <Button
                variant="ghost"
                className="mb-4"
                onClick={() => setSelectedGame(null)}
              >
                ← Back to Games
              </Button>
              
              {miniGames.find(game => game.id === selectedGame)?.component}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {miniGames.map(game => (
                <Card
                  key={game.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedGame(game.id)}
                >
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      {game.icon}
                      <CardTitle className="text-lg">{game.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">{game.description}</p>
                  </CardContent>
                  <CardFooter className="border-t bg-gray-50">
                    <Button className="w-full">Play Now</Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* Achievements content */}
        <TabsContent value="achievements" className="mt-0">
          <div className="grid md:grid-cols-3 gap-4">
            {achievements.map(achievement => (
              <Card
                key={achievement.id}
                className={`${
                  achievement.unlocked
                    ? 'border-green-200 bg-gradient-to-br from-white to-green-50'
                    : 'opacity-75 border-gray-200 bg-gray-50'
                }`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {achievement.icon}
                      <CardTitle className="text-base">{achievement.title}</CardTitle>
                    </div>
                    <Badge variant={achievement.unlocked ? "default" : "outline"} className="ml-2">
                      {achievement.unlocked ? "Unlocked" : "Locked"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-2">
                  <p className="text-sm text-gray-600">{achievement.description}</p>
                </CardContent>
                <CardFooter className="border-t bg-gray-50">
                  <div className="w-full flex items-center justify-between">
                    <div className="flex items-center">
                      <Award className="w-4 h-4 text-amber-500 mr-1" />
                      <span className="text-sm">{achievement.points} pts</span>
                    </div>
                    {!achievement.unlocked && achievement.id === 'complete_profile' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs"
                        onClick={() => unlockAchievement('complete_profile')}
                      >
                        Complete Profile
                      </Button>
                    )}
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}