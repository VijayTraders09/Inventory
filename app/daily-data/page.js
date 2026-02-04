"use client";
import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx-js-style';

const InventoryByCategory = ({ godownId ="694942adff01cba74c910fd5"}) => {
  const [data, setData] = useState({
    data: [],
    stocks: [],
    date: new Date().toISOString().split('T')[0],
    summary: {
      totalProducts: 0,
      totalQuantity: 0,
      totalPurchases: 0,
      totalSales: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/daily-data?godownId=${godownId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch inventory data');
        }
        
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (godownId) {
      fetchData();
    }
  }, [godownId]);

  // Group products by category
  const groupByCategory = () => {
    const grouped = {};
    
    data.data.forEach(product => {
      const categoryName = product.categoryName;
      
      if (!grouped[categoryName]) {
        grouped[categoryName] = {
          categoryId: product.categoryId,
          products: []
        };
      }
      
      grouped[categoryName].products.push(product);
    });
    
    return grouped;
  };

  // Export to Excel function with explicit styling
  const exportToExcel = () => {
    const groupedData = groupByCategory();
    const wb = XLSX.utils.book_new();
    
    // Create a new worksheet with styling
    const ws = XLSX.utils.aoa_to_sheet([]);
    
    // Set column widths first
    ws['!cols'] = [
      { wch: 8 },  // S.NO
      { wch: 25 }, // Product Name
      { wch: 10 }, // START
      { wch: 15 }, // IN (Purchase)
      { wch: 12 }, // OUT (Sale)
      { wch: 8 },  // TR
      { wch: 18 }  // END (Current Stock)
    ];
    
    // Add title with styling
    XLSX.utils.sheet_add_aoa(ws, [[`Inventory Report - ${data.date}`]], {origin: 'A1'});
    ws['A1'].s = {
      font: { bold: true, sz: 16, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "366092" } },
      alignment: { horizontal: "center" }
    };
    
    // Merge title cells
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }];
    
    let currentRow = 3; // Start after title and empty row
    
    // Process each category
    Object.entries(groupedData).forEach(([categoryName, categoryData]) => {
      // Add category name with styling
      XLSX.utils.sheet_add_aoa(ws, [[categoryName]], {origin: `A${currentRow}`});
      ws[`A${currentRow}`].s = {
        font: { bold: true, sz: 14, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "70AD47" } },
        alignment: { horizontal: "center" }
      };
      
      // Merge category name cells
      ws['!merges'].push({ s: { r: currentRow-1, c: 0 }, e: { r: currentRow-1, c: 6 } });
      
      currentRow++;
      
      // Add table headers with styling
      const headers = ['S.NO', 'Product Name', 'START', 'IN (Purchase)', 'OUT (Sale)', 'TR', 'END (Current Stock)'];
      XLSX.utils.sheet_add_aoa(ws, [headers], {origin: `A${currentRow}`});
      
      // Style each header cell
      for (let i = 0; i < headers.length; i++) {
        const cellRef = XLSX.utils.encode_cell({ r: currentRow-1, c: i });
        ws[cellRef].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: "D9E2F3" } },
          alignment: { horizontal: "center" },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
          }
        };
      }
      
      currentRow++;
      
      // Add product rows with borders
      categoryData.products.forEach((product, index) => {
        const startValue = product.currentQuantity - product.todayPurchases + product.todaySales;
        const trValue = product.todayPurchases - product.todaySales;
        
        const rowData = [
          index + 1,
          product.productName,
          startValue,
          product.todayPurchases,
          product.todaySales,
          trValue,
          product.currentQuantity
        ];
        
        XLSX.utils.sheet_add_aoa(ws, [rowData], {origin: `A${currentRow}`});
        
        // Style each cell in the row
        for (let i = 0; i < rowData.length; i++) {
          const cellRef = XLSX.utils.encode_cell({ r: currentRow-1, c: i });
          ws[cellRef].s = {
            border: {
              top: { style: "thin", color: { rgb: "000000" } },
              bottom: { style: "thin", color: { rgb: "000000" } },
              left: { style: "thin", color: { rgb: "000000" } },
              right: { style: "thin", color: { rgb: "000000" } }
            }
          };
        }
        
        currentRow++;
      });
      
      // Add total row with styling
      const totalData = [
        'TOTAL',
        '',
        categoryData.products.reduce((sum, product) => sum + (product.currentQuantity - product.todayPurchases + product.todaySales), 0),
        categoryData.products.reduce((sum, product) => sum + product.todayPurchases, 0),
        categoryData.products.reduce((sum, product) => sum + product.todaySales, 0),
        categoryData.products.reduce((sum, product) => sum + (product.todayPurchases - product.todaySales), 0),
        categoryData.products.reduce((sum, product) => sum + product.currentQuantity, 0)
      ];
      
      XLSX.utils.sheet_add_aoa(ws, [totalData], {origin: `A${currentRow}`});
      
      // Style each total cell
      for (let i = 0; i < totalData.length; i++) {
        const cellRef = XLSX.utils.encode_cell({ r: currentRow-1, c: i });
        ws[cellRef].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: "F2F2F2" } },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
          }
        };
      }
      
      currentRow += 3; // Skip empty rows
    });
    
    // Add overall summary
    XLSX.utils.sheet_add_aoa(ws, [['Overall Summary']], {origin: `A${currentRow}`});
    ws[`A${currentRow}`].s = {
      font: { bold: true, sz: 14, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "5B9BD5" } },
      alignment: { horizontal: "center" }
    };
    
    ws['!merges'].push({ s: { r: currentRow-1, c: 0 }, e: { r: currentRow-1, c: 3 } });
    
    currentRow++;
    
    const summaryHeaders = ['Total Products', 'Total Quantity', 'Total Purchases', 'Total Sales'];
    XLSX.utils.sheet_add_aoa(ws, [summaryHeaders], {origin: `A${currentRow}`});
    
    // Style summary headers
    for (let i = 0; i < summaryHeaders.length; i++) {
      const cellRef = XLSX.utils.encode_cell({ r: currentRow-1, c: i });
      ws[cellRef].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: "D9E2F3" } },
        alignment: { horizontal: "center" },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } }
        }
      };
    }
    
    currentRow++;
    
    const summaryData = [
      data.summary.totalProducts,
      data.summary.totalQuantity,
      data.summary.totalPurchases,
      data.summary.totalSales
    ];
    
    XLSX.utils.sheet_add_aoa(ws, [summaryData], {origin: `A${currentRow}`});
    
    // Style summary data
    for (let i = 0; i < summaryData.length; i++) {
      const cellRef = XLSX.utils.encode_cell({ r: currentRow-1, c: i });
      ws[cellRef].s = {
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } }
        }
      };
    }
    
    // Update the worksheet range
    const range = XLSX.utils.decode_range(ws['!ref']);
    ws['!ref'] = XLSX.utils.encode_range(range.s, {r: currentRow-1, c: 6});
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Inventory Report');
    
    // Generate Excel file and download
    XLSX.writeFile(wb, `Inventory_Report_${data.date}.xlsx`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-4 border-red-600 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold text-xl">Error:</strong>
        <span className="block sm:inline text-lg"> {error}</span>
      </div>
    );
  }

  const groupedData = groupByCategory();

  return (
    <div className="container mx-auto px-4 py-6">
      {/* MAIN HEADER WITH VERY VISIBLE STYLING */}
      <div className="bg-blue-900 shadow-2xl rounded-lg overflow-hidden mb-8 border-4 border-blue-700">
        <div className="bg-blue-800 text-white px-8 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-yellow-300">
            Inventory Report - {data.date}
          </h1>
          <button
            onClick={exportToExcel}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg flex items-center text-lg border-2 border-red-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Export to Excel
          </button>
        </div>
      </div>

      {/* CATEGORY TABLES WITH VERY VISIBLE STYLING */}
      {Object.entries(groupedData).map(([categoryName, categoryData]) => (
        <div key={categoryData.categoryId} className="bg-white shadow-2xl rounded-lg overflow-hidden mb-8 border-4 border-green-600">
          {/* NEW: CATEGORY NAME HEADER AT TOP - HIGHLIGHTED AND CENTERED */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-6 shadow-lg">
            <h2 className="text-3xl font-bold text-center text-yellow-300">
              {categoryName}
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            {/* TABLE WITH THICK BORDERS AND MATCHING HEADERS */}
            <table className="min-w-full divide-y divide-gray-200 border-4 border-gray-800">
              <thead className="bg-blue-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-800 uppercase tracking-wider border-4 border-gray-800">
                    S.NO
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-800 uppercase tracking-wider border-4 border-gray-800">
                    Product Name
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-800 uppercase tracking-wider border-4 border-gray-800">
                    START
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-800 uppercase tracking-wider border-4 border-gray-800">
                    IN (Purchase)
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-800 uppercase tracking-wider border-4 border-gray-800">
                    OUT (Sale)
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-800 uppercase tracking-wider border-4 border-gray-800">
                    TR
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-800 uppercase tracking-wider border-4 border-gray-800">
                    END (Current Stock)
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categoryData.products.map((product, index) => {
                  // Calculate START value: current quantity - purchases + sales
                  const startValue = product.currentQuantity - product.todayPurchases + product.todaySales;
                  // TR value is the difference between IN and OUT
                  const trValue = product.todayPurchases - product.todaySales;
                  
                  return (
                    <tr key={product.productId} className={index % 2 === 0 ? 'bg-white' : 'bg-yellow-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-4 border-gray-600">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-4 border-gray-600">
                        {product.productName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-4 border-gray-600">
                        {startValue}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-4 border-gray-600">
                        {product.todayPurchases}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-4 border-gray-600">
                        {product.todaySales}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-4 border-gray-600">
                        {trValue}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 border-4 border-gray-600">
                        {product.currentQuantity}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-300">
                <tr>
                  <td colSpan="2" className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 border-4 border-gray-800">
                    TOTAL
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 border-4 border-gray-800">
                    {categoryData.products.reduce((sum, product) => sum + (product.currentQuantity - product.todayPurchases + product.todaySales), 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 border-4 border-gray-800">
                    {categoryData.products.reduce((sum, product) => sum + product.todayPurchases, 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 border-4 border-gray-800">
                    {categoryData.products.reduce((sum, product) => sum + product.todaySales, 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 border-4 border-gray-800">
                    {categoryData.products.reduce((sum, product) => sum + (product.todayPurchases - product.todaySales), 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 border-4 border-gray-800">
                    {categoryData.products.reduce((sum, product) => sum + product.currentQuantity, 0)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      ))}
      
      {/* OVERALL SUMMARY WITH VERY VISIBLE STYLING */}
      <div className="bg-white shadow-2xl rounded-lg overflow-hidden border-4 border-purple-700">
        {/* NEW: CATEGORY NAME HEADER AT TOP - HIGHLIGHTED AND CENTERED */}
        <div className="bg-gradient-to-r from-purple-700 to-purple-800 text-white px-8 py-6 shadow-lg">
          <h2 className="text-3xl font-bold text-center text-yellow-300">
            Overall Summary
          </h2>
        </div>
        
        <div className="p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-blue-200 p-6 rounded-lg border-4 border-blue-600">
              <p className="text-lg text-blue-800 font-bold">Total Products</p>
              <p className="text-3xl font-bold text-blue-900">{data.summary.totalProducts}</p>
            </div>
            <div className="bg-green-200 p-6 rounded-lg border-4 border-green-600">
              <p className="text-lg text-green-800 font-bold">Total Quantity</p>
              <p className="text-3xl font-bold text-green-900">{data.summary.totalQuantity}</p>
            </div>
            <div className="bg-purple-200 p-6 rounded-lg border-4 border-purple-600">
              <p className="text-lg text-purple-800 font-bold">Total Purchases</p>
              <p className="text-3xl font-bold text-purple-900">{data.summary.totalPurchases}</p>
            </div>
            <div className="bg-orange-200 p-6 rounded-lg border-4 border-orange-600">
              <p className="text-lg text-orange-800 font-bold">Total Sales</p>
              <p className="text-3xl font-bold text-orange-900">{data.summary.totalSales}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryByCategory;