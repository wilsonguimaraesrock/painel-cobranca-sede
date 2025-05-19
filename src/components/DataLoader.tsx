
import { useState, useEffect, useRef } from "react";
import { Student } from "@/types";
import { getStudents, checkMonthData } from "@/services/supabaseService";
import { toast } from "sonner";

interface DataLoaderProps {
  selectedMonth: string;
  onDataLoaded: (students: Student[], source: "sheets" | "database" | "") => void;
  onLoadingChange: (loading: boolean) => void;
}

const DataLoader = ({ selectedMonth, onDataLoaded, onLoadingChange }: DataLoaderProps) => {
  // Hooks at the top
  const [loadingSource, setLoadingSource] = useState<"sheets" | "database" | "">("");
  const isMountedRef = useRef(true);
  
  // Effect for cleanup when unmounting
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // Effect for loading data when month changes
  useEffect(() => {
    // Skip loading if no month selected
    if (!selectedMonth) {
      onLoadingChange(false);
      return;
    }
    
    const fetchData = async () => {
      if (!isMountedRef.current) return;
      
      try {
        // Start loading
        onLoadingChange(true);
        console.log(`Loading data for month: ${selectedMonth}`);
        
        // Check if data exists in database
        const hasData = await checkMonthData(selectedMonth);
        console.log(`Data exists in database for month ${selectedMonth}: ${hasData}`);
        
        // Return early if component unmounted
        if (!isMountedRef.current) return;
        
        if (hasData) {
          // Load from database
          setLoadingSource("database");
          const dbStudents = await getStudents(selectedMonth);
          
          // Return early if component unmounted
          if (!isMountedRef.current) return;
          
          console.log(`Loaded ${dbStudents.length} students from database for month ${selectedMonth}`);
          
          if (dbStudents.length > 0) {
            onDataLoaded(dbStudents, "database");
            toast.success(`Data loaded from database`, {
              description: `${dbStudents.length} students for month ${selectedMonth}`
            });
          } else {
            toast.info(`No students found in database for month ${selectedMonth}`, {
              description: "You can use the 'Import from Spreadsheet' button to import data"
            });
            onDataLoaded([], "database");
          }
        } else {
          // No data in database
          if (!isMountedRef.current) return;
          
          toast.info(`No data found for month ${selectedMonth}`, {
            description: "You can use the 'Import from Spreadsheet' button to import data"
          });
          onDataLoaded([], "");
        }
      } catch (error) {
        // Return early if component unmounted
        if (!isMountedRef.current) return;
        
        console.error("Error loading data:", error);
        toast.error("Error loading data", {
          description: "Check your connection and try again."
        });
        onDataLoaded([], "");
      } finally {
        if (isMountedRef.current) {
          onLoadingChange(false);
          setLoadingSource("");
        }
      }
    };

    // Start fetching data
    fetchData();
  }, [selectedMonth, onDataLoaded, onLoadingChange]);

  // This component doesn't render anything
  return null;
};

export default DataLoader;
