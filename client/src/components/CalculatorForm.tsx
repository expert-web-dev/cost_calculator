import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon, Share2, Printer, Info, CheckCircle, XCircle, Home, Building, House } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { moveCalculationRequestSchema, type MoveCalculationResponse } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CostBreakdownChart } from "./CostBreakdownChart";
import { HOME_SIZES, ADDITIONAL_ITEMS, FLEXIBILITY_OPTIONS } from "@/lib/constants";
import { useAddressAutocomplete } from "@/lib/useAddressAutocomplete";

interface CalculatorFormProps {
  currentStep: number;
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>;
  setResults: React.Dispatch<React.SetStateAction<MoveCalculationResponse | null>>;
  results: MoveCalculationResponse | null;
}

const formSchema = moveCalculationRequestSchema.extend({
  moveDate: z.date({
    required_error: "Please select a date",
  }),
});

type FormValues = z.infer<typeof formSchema>;

export function CalculatorForm({ currentStep, setCurrentStep, setResults, results }: CalculatorFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const { suggestions: originSuggestions, query: originQuery, setQuery: setOriginQuery } = useAddressAutocomplete();
  const { suggestions: destSuggestions, query: destQuery, setQuery: setDestQuery } = useAddressAutocomplete();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      origin: "",
      destination: "",
      homeSize: undefined,
      additionalItems: "none",
      moveDate: undefined,
      flexibility: "exact",
      services: [],
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const response = await apiRequest("POST", "/api/calculate-moving-costs", {
        ...data,
        moveDate: format(data.moveDate, "yyyy-MM-dd"),
      });
      return response.json();
    },
    onSuccess: (data: MoveCalculationResponse) => {
      setResults(data);
      setCurrentStep(4);
      setLoading(false);
    },
    onError: (error) => {
      toast({
        title: "Error calculating costs",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
      setLoading(false);
    },
  });

  const handleNext = () => {
    if (currentStep < 4) {
      const fieldsToValidate = {
        1: ["origin", "destination"],
        2: ["homeSize", "additionalItems"],
        3: ["moveDate", "flexibility", "services"],
      }[currentStep];

      form.trigger(fieldsToValidate as any).then((isValid) => {
        if (isValid) {
          setCurrentStep(currentStep + 1);
        }
      });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = form.handleSubmit((data) => {
    setLoading(true);
    mutation.mutate(data);
  });

  // Handle sharing results
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'My Moving Cost Estimate',
        text: `Moving from ${results?.origin} to ${results?.destination} costs approximately $${results?.costs.hybrid}`,
        url: window.location.href,
      }).catch((error) => console.log('Error sharing', error));
    } else {
      toast({
        title: "Sharing not supported",
        description: "Your browser doesn't support the Web Share API",
      });
    }
  };

  // Handle printing results
  const handlePrint = () => {
    window.print();
  };

  const handleSelectOriginSuggestion = (suggestion: string) => {
    form.setValue("origin", suggestion);
    setOriginQuery("");
  };

  const handleSelectDestSuggestion = (suggestion: string) => {
    form.setValue("destination", suggestion);
    setDestQuery("");
  };

  return (
    <form onSubmit={handleSubmit} className="p-6">
      {/* Step 1: Location Information */}
      <div className={cn("space-y-6", currentStep !== 1 && "hidden")}>
        <h3 className="text-xl font-medium text-gray-900">Where are you moving from and to?</h3>
        
        <div className="relative">
          <div className="form-floating relative">
            <Input
              id="origin"
              {...form.register("origin")}
              className="block w-full px-4 py-3 focus:ring-0"
              placeholder="Origin Address"
              value={originQuery !== null ? originQuery : form.watch("origin")}
              onChange={(e) => {
                setOriginQuery(e.target.value);
                form.setValue("origin", e.target.value);
              }}
            />
            <Label 
              htmlFor="origin" 
              className={cn(
                "absolute top-3 left-4 text-gray-500 pointer-events-none transition-all",
                (form.watch("origin") || originQuery) && "text-xs -translate-y-5 bg-white px-1"
              )}
            >
              Origin Address
            </Label>
            {form.formState.errors.origin && (
              <p className="text-red-500 text-xs mt-1">{form.formState.errors.origin.message}</p>
            )}
            <div className="text-xs text-gray-500 mt-1">Start typing for address suggestions</div>
          </div>
          
          {originSuggestions.length > 0 && originQuery && (
            <ul className="absolute z-10 bg-white border rounded-md w-full mt-1 max-h-60 overflow-auto">
              {originSuggestions.map((suggestion, i) => (
                <li 
                  key={i} 
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleSelectOriginSuggestion(suggestion)}
                >
                  {suggestion}
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div className="relative">
          <div className="form-floating relative">
            <Input
              id="destination"
              {...form.register("destination")}
              className="block w-full px-4 py-3 focus:ring-0"
              placeholder="Destination Address"
              value={destQuery !== null ? destQuery : form.watch("destination")}
              onChange={(e) => {
                setDestQuery(e.target.value);
                form.setValue("destination", e.target.value);
              }}
            />
            <Label 
              htmlFor="destination" 
              className={cn(
                "absolute top-3 left-4 text-gray-500 pointer-events-none transition-all",
                (form.watch("destination") || destQuery) && "text-xs -translate-y-5 bg-white px-1"
              )}
            >
              Destination Address
            </Label>
            {form.formState.errors.destination && (
              <p className="text-red-500 text-xs mt-1">{form.formState.errors.destination.message}</p>
            )}
            <div className="text-xs text-gray-500 mt-1">Start typing for address suggestions</div>
          </div>
          
          {destSuggestions.length > 0 && destQuery && (
            <ul className="absolute z-10 bg-white border rounded-md w-full mt-1 max-h-60 overflow-auto">
              {destSuggestions.map((suggestion, i) => (
                <li 
                  key={i} 
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleSelectDestSuggestion(suggestion)}
                >
                  {suggestion}
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div className="flex justify-between mt-8">
          <Button
            type="button"
            variant="outline"
            className="bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors invisible"
          >
            Back
          </Button>
          <Button
            type="button"
            onClick={handleNext}
            className="bg-primary hover:bg-indigo-700 text-white font-medium"
          >
            Continue
          </Button>
        </div>
      </div>
      
      {/* Step 2: Home Size */}
      <div className={cn("space-y-6", currentStep !== 2 && "hidden")}>
        <h3 className="text-xl font-medium text-gray-900">Tell us about your home</h3>
        
        <div className="space-y-4">
          <Label className="block text-gray-700">Home size</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Controller
              control={form.control}
              name="homeSize"
              render={({ field }) => (
                <>
                  {HOME_SIZES.map((size) => (
                    <div key={size.value} className="relative">
                      <input
                        type="radio"
                        id={size.value}
                        className="peer hidden"
                        checked={field.value === size.value}
                        onChange={() => field.onChange(size.value)}
                      />
                      <label
                        htmlFor={size.value}
                        className={cn(
                          "block p-4 border-2 rounded-lg cursor-pointer text-center hover:border-primary",
                          field.value === size.value && "border-primary bg-indigo-50"
                        )}
                      >
                        <span className="block mx-auto mb-2">
                          {size.iconName === "Building" ? (
                            <Building className="block mx-auto mb-2 h-6 w-6" />
                          ) : size.iconName === "House" ? (
                            <House className="block mx-auto mb-2 h-6 w-6" />
                          ) : (
                            <Home className="block mx-auto mb-2 h-6 w-6" />
                          )}
                        </span>
                        <span className="font-medium">{size.label}</span>
                      </label>
                    </div>
                  ))}
                </>
              )}
            />
          </div>
          {form.formState.errors.homeSize && (
            <p className="text-red-500 text-xs mt-1">{form.formState.errors.homeSize.message}</p>
          )}
        </div>
        
        <div className="space-y-4">
          <Label htmlFor="additionalItems" className="block text-gray-700">
            Do you have any large or special items?
          </Label>
          <Controller
            control={form.control}
            name="additionalItems"
            render={({ field }) => (
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <SelectTrigger className="w-full px-4 py-3 border border-gray-300 rounded-md bg-white">
                  <SelectValue placeholder="Select items" />
                </SelectTrigger>
                <SelectContent>
                  {ADDITIONAL_ITEMS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        
        <div className="flex justify-between mt-8">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            className="bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
          >
            Back
          </Button>
          <Button
            type="button"
            onClick={handleNext}
            className="bg-primary hover:bg-indigo-700 text-white font-medium"
          >
            Continue
          </Button>
        </div>
      </div>
      
      {/* Step 3: Move Date */}
      <div className={cn("space-y-6", currentStep !== 3 && "hidden")}>
        <h3 className="text-xl font-medium text-gray-900">When are you planning to move?</h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Label htmlFor="moveDate" className="block text-gray-700">Move date</Label>
            <Controller
              control={form.control}
              name="moveDate"
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
            {form.formState.errors.moveDate && (
              <p className="text-red-500 text-xs mt-1">{form.formState.errors.moveDate.message?.toString()}</p>
            )}
          </div>
          
          <div className="space-y-4">
            <Label htmlFor="flexibility" className="block text-gray-700">How flexible is your date?</Label>
            <Controller
              control={form.control}
              name="flexibility"
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <SelectTrigger className="w-full px-4 py-3 border border-gray-300 rounded-md bg-white">
                    <SelectValue placeholder="Select flexibility" />
                  </SelectTrigger>
                  <SelectContent>
                    {FLEXIBILITY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>
        
        <div className="space-y-4">
          <Label className="block text-gray-700">Additional services needed</Label>
          <div className="space-y-3">
            <div className="flex items-start">
              <Controller
                control={form.control}
                name="services"
                render={({ field }) => (
                  <Checkbox
                    id="packing"
                    checked={field.value?.includes("packing")}
                    onCheckedChange={(checked) => {
                      const updatedServices = checked
                        ? [...(field.value || []), "packing"]
                        : (field.value || []).filter((value) => value !== "packing");
                      field.onChange(updatedServices);
                    }}
                    className="mt-0.5 h-5 w-5 text-primary border-gray-300 rounded"
                  />
                )}
              />
              <Label htmlFor="packing" className="ml-3 text-gray-700">
                <span className="block font-medium">Packing Service</span>
                <span className="text-sm text-gray-500">Professional packing of all your belongings</span>
              </Label>
            </div>
            <div className="flex items-start">
              <Controller
                control={form.control}
                name="services"
                render={({ field }) => (
                  <Checkbox
                    id="storage"
                    checked={field.value?.includes("storage")}
                    onCheckedChange={(checked) => {
                      const updatedServices = checked
                        ? [...(field.value || []), "storage"]
                        : (field.value || []).filter((value) => value !== "storage");
                      field.onChange(updatedServices);
                    }}
                    className="mt-0.5 h-5 w-5 text-primary border-gray-300 rounded"
                  />
                )}
              />
              <Label htmlFor="storage" className="ml-3 text-gray-700">
                <span className="block font-medium">Temporary Storage</span>
                <span className="text-sm text-gray-500">Secure storage between moving dates</span>
              </Label>
            </div>
            <div className="flex items-start">
              <Controller
                control={form.control}
                name="services"
                render={({ field }) => (
                  <Checkbox
                    id="cleaning"
                    checked={field.value?.includes("cleaning")}
                    onCheckedChange={(checked) => {
                      const updatedServices = checked
                        ? [...(field.value || []), "cleaning"]
                        : (field.value || []).filter((value) => value !== "cleaning");
                      field.onChange(updatedServices);
                    }}
                    className="mt-0.5 h-5 w-5 text-primary border-gray-300 rounded"
                  />
                )}
              />
              <Label htmlFor="cleaning" className="ml-3 text-gray-700">
                <span className="block font-medium">Cleaning Service</span>
                <span className="text-sm text-gray-500">Move-out cleaning of your old home</span>
              </Label>
            </div>
          </div>
        </div>
        
        <div className="flex justify-between mt-8">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            className="bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
          >
            Back
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-primary hover:bg-indigo-700 text-white font-medium"
          >
            {loading ? "Calculating..." : "Calculate Costs"}
          </Button>
        </div>
      </div>
      
      {/* Step 4: Results */}
      <div className={cn("space-y-6", currentStep !== 4 && "hidden")}>
        {results && (
          <>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-medium text-gray-900">Your Moving Options</h3>
              
              <div className="flex items-center space-x-2">
                <Button 
                  type="button" 
                  variant="ghost"
                  className="inline-flex items-center text-primary hover:text-indigo-700 font-medium"
                  onClick={handleShare}
                >
                  <Share2 className="mr-1 h-4 w-4" /> Share
                </Button>
                <Button 
                  type="button" 
                  variant="ghost"
                  className="inline-flex items-center text-primary hover:text-indigo-700 font-medium"
                  onClick={handlePrint}
                >
                  <Printer className="mr-1 h-4 w-4" /> Print
                </Button>
              </div>
            </div>
            
            <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
              <div className="flex items-start">
                <Info className="text-primary mr-3 h-5 w-5 mt-0.5" />
                <div>
                  <p className="text-gray-700">Moving from <span className="font-medium">{results.origin}</span> to <span className="font-medium">{results.destination}</span></p>
                  <p className="text-gray-700 mt-1">
                    <span className="font-medium">{HOME_SIZES.find(s => s.value === results.homeSize)?.label}</span> home on 
                    <span className="font-medium"> {format(new Date(results.moveDate), "MMMM d, yyyy")}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-2">Estimates based on approximately {results.distance} miles distance</p>
                </div>
              </div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {/* DIY Option */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-100 p-4 border-b">
                  <h4 className="font-semibold text-lg">DIY Move</h4>
                  <p className="text-gray-600 text-sm">Rent a truck and move yourself</p>
                </div>
                <div className="p-5 space-y-4">
                  <div className="text-center">
                    <span className="text-3xl font-bold text-gray-900">${results.costs.diy}</span>
                    <span className="text-gray-500 ml-1">estimated</span>
                  </div>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <CheckCircle className="text-green-500 mr-2 h-4 w-4 mt-0.5" />
                      <span className="text-sm text-gray-700">15 ft truck rental (1 day)</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="text-green-500 mr-2 h-4 w-4 mt-0.5" />
                      <span className="text-sm text-gray-700">Fuel and mileage costs</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="text-green-500 mr-2 h-4 w-4 mt-0.5" />
                      <span className="text-sm text-gray-700">Basic moving supplies</span>
                    </li>
                    <li className="flex items-start">
                      <XCircle className="text-red-500 mr-2 h-4 w-4 mt-0.5" />
                      <span className="text-sm text-gray-400">No loading/unloading help</span>
                    </li>
                    <li className="flex items-start">
                      <XCircle className="text-red-500 mr-2 h-4 w-4 mt-0.5" />
                      <span className="text-sm text-gray-400">No insurance coverage</span>
                    </li>
                  </ul>
                  <div className="pt-4">
                    <Button className="w-full bg-gray-800 hover:bg-black text-white font-medium py-2 rounded-md shadow-sm transition-colors">
                      View Truck Options
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Hybrid Option */}
              <div className="border rounded-lg overflow-hidden border-primary shadow-md">
                <div className="bg-indigo-50 p-4 border-b border-primary">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-lg">Hybrid Move</h4>
                      <p className="text-gray-600 text-sm">You pack, we drive</p>
                    </div>
                    <div className="bg-primary text-white text-xs font-medium px-2 py-1 rounded">
                      POPULAR
                    </div>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  <div className="text-center">
                    <span className="text-3xl font-bold text-gray-900">${results.costs.hybrid}</span>
                    <span className="text-gray-500 ml-1">estimated</span>
                  </div>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <CheckCircle className="text-green-500 mr-2 h-4 w-4 mt-0.5" />
                      <span className="text-sm text-gray-700">Moving container delivery</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="text-green-500 mr-2 h-4 w-4 mt-0.5" />
                      <span className="text-sm text-gray-700">Transportation to new home</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="text-green-500 mr-2 h-4 w-4 mt-0.5" />
                      <span className="text-sm text-gray-700">Flexible loading time (3 days)</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="text-green-500 mr-2 h-4 w-4 mt-0.5" />
                      <span className="text-sm text-gray-700">Basic insurance included</span>
                    </li>
                    <li className="flex items-start">
                      <XCircle className="text-red-500 mr-2 h-4 w-4 mt-0.5" />
                      <span className="text-sm text-gray-400">No loading/unloading help</span>
                    </li>
                  </ul>
                  <div className="pt-4">
                    <Button className="w-full bg-primary hover:bg-indigo-700 text-white font-medium py-2 rounded-md shadow-sm transition-colors">
                      Select This Option
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Full Service Option */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-100 p-4 border-b">
                  <h4 className="font-semibold text-lg">Full-Service Move</h4>
                  <p className="text-gray-600 text-sm">We handle everything</p>
                </div>
                <div className="p-5 space-y-4">
                  <div className="text-center">
                    <span className="text-3xl font-bold text-gray-900">${results.costs.fullService}</span>
                    <span className="text-gray-500 ml-1">estimated</span>
                  </div>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <CheckCircle className="text-green-500 mr-2 h-4 w-4 mt-0.5" />
                      <span className="text-sm text-gray-700">Professional movers (3-person crew)</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="text-green-500 mr-2 h-4 w-4 mt-0.5" />
                      <span className="text-sm text-gray-700">Loading and unloading</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="text-green-500 mr-2 h-4 w-4 mt-0.5" />
                      <span className="text-sm text-gray-700">Transportation in company truck</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="text-green-500 mr-2 h-4 w-4 mt-0.5" />
                      <span className="text-sm text-gray-700">Basic packing supplies</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="text-green-500 mr-2 h-4 w-4 mt-0.5" />
                      <span className="text-sm text-gray-700">Full insurance coverage</span>
                    </li>
                  </ul>
                  <div className="pt-4">
                    <Button className="w-full bg-gray-800 hover:bg-black text-white font-medium py-2 rounded-md shadow-sm transition-colors">
                      View Moving Companies
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Cost Breakdown */}
            <div className="mt-10">
              <h3 className="text-xl font-medium text-gray-900 mb-6">Cost Breakdown</h3>
              
              <div className="bg-white border rounded-lg overflow-hidden">
                <div className="p-6">
                  <CostBreakdownChart breakdown={results.breakdown} />
                  <div className="text-xs text-gray-500 text-center mt-4">
                    Hover over chart segments to see detailed cost breakdown
                  </div>
                </div>
              </div>
            </div>
            
            {/* Recommended Companies */}
            <div className="mt-10">
              <h3 className="text-xl font-medium text-gray-900 mb-6">Recommended Moving Companies</h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                {results.companies.map((company, index) => (
                  <div key={index} className="border rounded-lg p-4 flex">
                    <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="text-gray-400 h-10 w-10" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div className="ml-4 flex-grow">
                      <div className="flex justify-between">
                        <h4 className="font-medium text-lg">{company.name}</h4>
                        <div className="flex items-center">
                          <span className="text-amber-500 font-medium">{company.rating}</span>
                          <div className="flex text-amber-400 ml-1">
                            {Array(5).fill(0).map((_, i) => (
                              <svg 
                                key={i} 
                                className="h-4 w-4" 
                                fill={i < Math.floor(company.rating) ? "currentColor" : "none"} 
                                strokeWidth={1.5} 
                                viewBox="0 0 24 24" 
                                stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                              </svg>
                            ))}
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{company.description}</p>
                      <p className="text-sm font-medium text-green-600 mt-3">
                        {company.available 
                          ? "Available on your selected date" 
                          : "Not available on your selected date"}
                      </p>
                      <div className="mt-2">
                        <a href="#" className="text-primary hover:text-indigo-700 text-sm font-medium">
                          Get a custom quote
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-between mt-8">
              <Button 
                type="button" 
                variant="outline"
                className="bg-gray-200 text-gray-700 py-2 px-4 rounded-md shadow-sm hover:bg-gray-300 transition-colors"
                onClick={handlePrevious}
              >
                Change Details
              </Button>
              <Button 
                type="button" 
                className="bg-primary hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-md shadow-sm transition-colors"
              >
                Book Free Consultation
              </Button>
            </div>
          </>
        )}
      </div>
    </form>
  );
}
