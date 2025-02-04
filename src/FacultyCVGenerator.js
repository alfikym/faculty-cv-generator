import React, { useState } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import * as FileSaver from "file-saver";
import JSZip from "jszip";

export default function FacultyCVGenerator() {
  const [facultyData, setFacultyData] = useState([]);
  const [columnNames, setColumnNames] = useState([]);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        if (jsonData.length === 0) {
          alert("The uploaded Excel file contains no data.");
          return;
        }

        setFacultyData(jsonData);
        setColumnNames(Object.keys(jsonData[0]));
      } catch (error) {
        console.error("Error processing Excel file:", error);
        alert("Invalid file format or corrupted file. Please upload a valid Excel file.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const generatePDF = async () => {
    if (facultyData.length === 0) {
      alert("No faculty data available to generate PDFs.");
      return;
    }

    const zip = new JSZip();
    alert("Generating CVs. Please wait...");

    try {
      for (const faculty of facultyData) {
        const doc = new jsPDF();
        doc.setFontSize(16);
        const title = faculty[columnNames[0]]?.toString() || "Unknown";
        doc.text(title, 10, 10);

        doc.setFontSize(12);
        let yOffset = 20;

        columnNames.forEach((key) => {
          const value = faculty[key] ? faculty[key].toString() : "Not Provided";
          doc.text(`${key}: ${value}`, 10, yOffset);
          yOffset += 10;
        });

        const pdfBlob = doc.output("blob");
        zip.file(`${title}.pdf`, pdfBlob);
      }

      if (Object.keys(zip.files).length === 0) {
        throw new Error("No valid PDFs were generated.");
      }

      const zipContent = await zip.generateAsync({ type: "blob" });
      FileSaver.saveAs(zipContent, "Faculty_CVs.zip");
      alert("Download completed!");
    } catch (error) {
      console.error("ZIP generation error:", error);
      alert("Error generating ZIP file. Please check the data format and try again.");
    }
  };

  return (
    <div className="flex flex-col items-center p-5">
      <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="mb-4" />
      <button onClick={generatePDF} disabled={facultyData.length === 0} className="px-4 py-2 bg-blue-500 text-white rounded">
        Generate & Download CVs
      </button>
    </div>
  );
}
