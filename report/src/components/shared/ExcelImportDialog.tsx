"use client";

import type { ChangeEvent } from 'react';
import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UploadCloud, DownloadCloud, FileText } from 'lucide-react';
import { Label } from '../ui/label';

interface ExcelImportDialogProps<T> {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: T[]) => Promise<{ success: boolean; message: string }>;
  templateHeaders: string[];
  templateFileName: string;
  dialogTitle: string;
  dialogDescription: string;
}

export function ExcelImportDialog<T>({
  isOpen,
  onClose,
  onImport,
  templateHeaders,
  templateFileName,
  dialogTitle,
  dialogDescription,
}: ExcelImportDialogProps<T>) {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      if (selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || selectedFile.type === 'application/vnd.ms-excel') {
        setFile(selectedFile);
      } else {
        toast({
          title: 'Invalid File Type',
          description: 'Please upload an Excel file (.xlsx or .xls).',
          variant: 'destructive',
        });
        setFile(null);
        event.target.value = ''; // Reset file input
      }
    }
  };

  const handleImportClick = useCallback(async () => {
    if (!file) {
      toast({ title: 'No File Selected', description: 'Please select an Excel file to import.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        if (!data) throw new Error("Failed to read file data.");
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<T>(worksheet, { header: 1 });
        
        // Assuming first row is headers, actual data starts from second row
        // Map headers to object keys based on templateHeaders
        const headersFromFile = jsonData[0] as string[];
        const importedData: T[] = jsonData.slice(1).map((rowArray: any) => {
          const rowObject: any = {};
          templateHeaders.forEach((header, index) => {
            // Find the index of the template header in the file's headers
            const fileHeaderIndex = headersFromFile.findIndex(fh => fh?.toString().trim().toLowerCase() === header.toLowerCase());
            if (fileHeaderIndex !== -1) {
              rowObject[header] = rowArray[fileHeaderIndex];
            } else {
              // Handle missing header - perhaps skip or use undefined
              // For robustness, you might want to ensure all templateHeaders are present
            }
          });
          return rowObject as T;
        }).filter(row => Object.values(row as any).some(val => val !== null && val !== undefined && val !== '')); // Filter out empty rows


        if (importedData.length === 0) {
          toast({ title: 'No Data Found', description: 'The Excel file seems to be empty or headers do not match.', variant: 'destructive' });
          setIsLoading(false);
          return;
        }
        
        const result = await onImport(importedData);
        if (result.success) {
          toast({ title: 'Import Successful', description: result.message });
          onClose(); // Close dialog on successful import
        } else {
          toast({ title: 'Import Failed', description: result.message, variant: 'destructive' });
        }
      } catch (error: any) {
        console.error('Error importing Excel data:', error);
        toast({ title: 'Import Error', description: error.message || 'An unexpected error occurred during import.', variant: 'destructive' });
      } finally {
        setIsLoading(false);
        setFile(null); 
        // Reset file input visually
        const fileInput = document.getElementById('excel-file') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
      }
    };
    reader.readAsBinaryString(file);
  }, [file, onImport, toast, templateHeaders, onClose]);

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([templateHeaders]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, templateFileName);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { setFile(null); onClose();} }}>
      <DialogContent className="sm:max-w-md bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UploadCloud className="h-6 w-6 text-primary" /> {dialogTitle}
          </DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-1">
            <Label htmlFor="excel-file" className="text-sm font-medium">Upload Excel File</Label>
            <Input id="excel-file" type="file" accept=".xlsx, .xls" onChange={handleFileChange} className="border-input" />
            {file && <p className="text-xs text-muted-foreground mt-1">Selected: {file.name}</p>}
          </div>

          <Button variant="outline" onClick={downloadTemplate} className="w-full text-sm">
            <DownloadCloud className="mr-2 h-4 w-4" /> Download Template ({templateFileName})
          </Button>
          <p className="text-xs text-muted-foreground">
            Ensure your Excel file has the headers: {templateHeaders.join(', ')}.
            The first sheet in the Excel file will be used.
          </p>
        </div>

        <DialogFooter className="sm:justify-start">
          <Button type="button" onClick={handleImportClick} disabled={!file || isLoading} className="w-full sm:w-auto bg-accent hover:bg-accent/80">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
            Import Data
          </Button>
          <DialogClose asChild>
            <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={() => setFile(null)}>
              Cancel
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
