import { useState } from 'react';
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  RadialBarChart, RadialBar, Label
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, Users, Package, HelpCircle, PieChart as PieChartIcon, BarChart as BarChartIcon, Activity } from 'lucide-react';

interface CostBreakdownChartProps {
  breakdown: {
    transportation: number;
    labor: number;
    materials: number;
    other: number;
  };
  costs?: {
    diy: number;
    hybrid: number;
    fullService: number;
  };
}

// Enhanced descriptions for cost categories
const costDescriptions = {
  transportation: "Transportation costs include truck rental, fuel, and distance-based charges for relocating your belongings.",
  labor: "Labor costs cover loading, unloading, and any additional help required during your move.",
  materials: "Materials include boxes, tape, bubble wrap, furniture covers, and other packing supplies.",
  other: "Other costs may include insurance, storage fees, specialty item handling, and potential unexpected expenses.",
};

// Icons for each cost category
const costIcons = {
  transportation: <Truck className="h-4 w-4" />,
  labor: <Users className="h-4 w-4" />,
  materials: <Package className="h-4 w-4" />,
  other: <HelpCircle className="h-4 w-4" />,
};

// Color palette with lighter variants for hover states
const colorPalette = {
  transportation: { main: '#4F46E5', light: '#818CF8' },
  labor: { main: '#2563EB', light: '#60A5FA' },
  materials: { main: '#8B5CF6', light: '#A78BFA' },
  other: { main: '#EC4899', light: '#F472B6' },
};

// Chart type options
type ChartType = 'pie' | 'bar' | 'radial';

export function CostBreakdownChart({ breakdown, costs }: CostBreakdownChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [chartType, setChartType] = useState<ChartType>('pie');
  const [selectedTab, setSelectedTab] = useState<string>("hybrid");
  
  // Calculate total cost
  const totalCost = Object.values(breakdown).reduce((sum, value) => sum + value, 0);
  
  // Prepare data for charts
  const data = [
    { 
      name: 'Transportation', 
      value: breakdown.transportation, 
      color: colorPalette.transportation.main,
      lightColor: colorPalette.transportation.light,
      percent: Math.round((breakdown.transportation / totalCost) * 100),
      icon: costIcons.transportation,
      description: costDescriptions.transportation
    },
    { 
      name: 'Labor', 
      value: breakdown.labor, 
      color: colorPalette.labor.main,
      lightColor: colorPalette.labor.light,
      percent: Math.round((breakdown.labor / totalCost) * 100),
      icon: costIcons.labor,
      description: costDescriptions.labor
    },
    { 
      name: 'Materials', 
      value: breakdown.materials, 
      color: colorPalette.materials.main,
      lightColor: colorPalette.materials.light,
      percent: Math.round((breakdown.materials / totalCost) * 100),
      icon: costIcons.materials,
      description: costDescriptions.materials
    },
    { 
      name: 'Other', 
      value: breakdown.other, 
      color: colorPalette.other.main,
      lightColor: colorPalette.other.light,
      percent: Math.round((breakdown.other / totalCost) * 100),
      icon: costIcons.other,
      description: costDescriptions.other
    },
  ];
  
  // Compare data for different moving types
  const compareData = costs ? [
    { name: 'DIY', value: costs.diy },
    { name: 'Hybrid', value: costs.hybrid },
    { name: 'Full Service', value: costs.fullService },
  ] : [];
  
  // Event handlers
  const handlePieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };
  
  const handlePieLeave = () => {
    setActiveIndex(null);
  };
  
  // Define types for tooltip props
  interface TooltipProps {
    active?: boolean;
    payload?: Array<{
      payload: {
        name: string;
        value: number;
        color: string;
        percent: number;
        description: string;
      };
    }>;
  }
  
  // Custom tooltip content with enhanced styling
  const CustomTooltip: React.FC<TooltipProps> = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-100 max-w-xs">
          <div className="flex items-center mb-2">
            <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: data.color }}></div>
            <h3 className="font-semibold text-gray-900">{data.name}</h3>
          </div>
          <div className="mb-2">
            <span className="text-2xl font-bold text-gray-900">${data.value}</span>
            <span className="text-gray-500 ml-1">({data.percent}%)</span>
          </div>
          <p className="text-gray-600 text-sm">{data.description}</p>
        </div>
      );
    }
    return null;
  };
  
  // Render the appropriate chart based on selected type
  const renderChart = () => {
    switch (chartType) {
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                innerRadius={60}
                dataKey="value"
                paddingAngle={2}
                onMouseEnter={handlePieEnter}
                onMouseLeave={handlePieLeave}
                animationDuration={500}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={activeIndex === index ? entry.lightColor : entry.color}
                    stroke={activeIndex === index ? entry.color : "none"}
                    strokeWidth={activeIndex === index ? 2 : 0}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                layout="horizontal" 
                verticalAlign="bottom" 
                align="center"
                formatter={(value: string, entry: any, index: number) => (
                  <span className="text-sm font-medium flex items-center">
                    {data[index].icon}
                    <span className="ml-1">{value} ({data[index].percent}%)</span>
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        );
        
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis 
                tickFormatter={(value: number) => `$${value}`}
                width={60}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" animationDuration={500}>
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={activeIndex === index ? entry.lightColor : entry.color}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
        
      case 'radial':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <RadialBarChart 
              cx="50%" 
              cy="50%" 
              innerRadius="20%" 
              outerRadius="100%" 
              barSize={20} 
              data={data}
              startAngle={90}
              endAngle={-270}
            >
              <RadialBar
                label={{ fill: '#666', position: 'insideStart' }}
                background
                dataKey="value"
                animationDuration={500}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                  />
                ))}
              </RadialBar>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                layout="horizontal" 
                verticalAlign="bottom" 
                align="center"
                formatter={(value: string, entry: any, index: number) => (
                  <span className="text-sm font-medium flex items-center">
                    {data[index].icon}
                    <span className="ml-1">{value} (${data[index].value})</span>
                  </span>
                )}
              />
            </RadialBarChart>
          </ResponsiveContainer>
        );
    }
  };
  
  // Compare options section (if costs are provided)
  const renderCompareSection = () => {
    if (!costs) return null;
    
    return (
      <div className="mt-6">
        <Tabs defaultValue="hybrid" value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="diy">DIY</TabsTrigger>
            <TabsTrigger value="hybrid">Hybrid</TabsTrigger>
            <TabsTrigger value="fullService">Full Service</TabsTrigger>
          </TabsList>
          
          <TabsContent value="diy" className="mt-0">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">DIY Move Breakdown</CardTitle>
                <CardDescription>Total cost: ${costs.diy}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {data.map((item, index) => (
                    <li key={index} className="flex justify-between items-center py-1 border-b border-gray-100">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></div>
                        <span className="text-sm">{item.name}</span>
                      </div>
                      <span className="font-medium">${Math.round(item.value * 0.7)}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="hybrid" className="mt-0">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Hybrid Move Breakdown</CardTitle>
                <CardDescription>Total cost: ${costs.hybrid}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {data.map((item, index) => (
                    <li key={index} className="flex justify-between items-center py-1 border-b border-gray-100">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></div>
                        <span className="text-sm">{item.name}</span>
                      </div>
                      <span className="font-medium">${item.value}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="fullService" className="mt-0">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Full Service Breakdown</CardTitle>
                <CardDescription>Total cost: ${costs.fullService}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {data.map((item, index) => (
                    <li key={index} className="flex justify-between items-center py-1 border-b border-gray-100">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></div>
                        <span className="text-sm">{item.name}</span>
                      </div>
                      <span className="font-medium">${Math.round(item.value * 1.5)}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-center mb-4">
        <div className="inline-flex items-center rounded-md shadow-sm" role="group">
          <Button
            variant={chartType === 'pie' ? 'default' : 'outline'}
            className={`rounded-l-md rounded-r-none ${chartType === 'pie' ? 'bg-primary text-white' : ''}`}
            onClick={() => setChartType('pie')}
          >
            <PieChartIcon className="h-4 w-4 mr-1" />
            Pie
          </Button>
          <Button
            variant={chartType === 'bar' ? 'default' : 'outline'}
            className={`rounded-none ${chartType === 'bar' ? 'bg-primary text-white' : ''}`}
            onClick={() => setChartType('bar')}
          >
            <BarChartIcon className="h-4 w-4 mr-1" />
            Bar
          </Button>
          <Button
            variant={chartType === 'radial' ? 'default' : 'outline'}
            className={`rounded-r-md rounded-l-none ${chartType === 'radial' ? 'bg-primary text-white' : ''}`}
            onClick={() => setChartType('radial')}
          >
            <Activity className="h-4 w-4 mr-1" />
            Radial
          </Button>
        </div>
      </div>
      
      {renderChart()}
      {renderCompareSection()}
    </div>
  );
}
