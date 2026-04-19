import { Task, TaskStatus } from "../../types";

function escapeCsvField(field: string): string {
  if (field.includes(",") || field.includes('"') || field.includes("\n")) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

export function exportToCSV(tasks: Task[]) {
  const headers = ["Assignee", "Task Title", "Description", "Status", "Deadline", "Source"];
  const rows = tasks.map((t) => [
    t.assigneeId || "Unassigned",
    t.title,
    t.description || "",
    t.status,
    t.deadline ? new Date(t.deadline).toLocaleDateString() : "-",
    t.source,
  ]);

  const csvContent = [headers, ...rows].map((e) => e.map(escapeCsvField).join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `project_export_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function exportToExcel(tasks: Task[]) {
  const XLSX = await import("xlsx");
  const data = tasks.map((t) => ({
    Assignee: t.assigneeId || "Unassigned",
    "Task Title": t.title,
    Description: t.description || "",
    Status: t.status,
    Deadline: t.deadline ? new Date(t.deadline).toLocaleDateString() : "-",
    Source: t.source,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Tasks");
  XLSX.writeFile(workbook, `project_export_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export async function exportToPNG(tasks: Task[]) {
  const html2canvas = (await import("html2canvas")).default;

  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.width = "1200px";
  container.style.padding = "40px";
  container.style.backgroundColor = "#ffffff";
  container.style.color = "#1e293b";
  container.style.fontFamily = "'Inter', system-ui, sans-serif";

  const title = document.createElement("h1");
  title.innerText = `Task Report - ${new Date().toLocaleDateString()}`;
  title.style.fontSize = "24px";
  title.style.fontWeight = "bold";
  title.style.marginBottom = "20px";
  title.style.color = "#4f46e5";
  container.appendChild(title);

  const table = document.createElement("table");
  table.style.width = "100%";
  table.style.borderCollapse = "collapse";
  table.style.border = "1px solid #e2e8f0";

  const thead = document.createElement("thead");
  const hRow = document.createElement("tr");
  ["Assignee", "Task Title", "Description", "Status", "Deadline"].forEach((text) => {
    const th = document.createElement("th");
    th.innerText = text;
    th.style.backgroundColor = "#f1f5f9";
    th.style.padding = "12px";
    th.style.textAlign = "left";
    th.style.borderBottom = "2px solid #4f46e5";
    th.style.color = "#64748b";
    th.style.fontSize = "12px";
    th.style.textTransform = "uppercase";
    th.style.letterSpacing = "0.05em";
    hRow.appendChild(th);
  });
  thead.appendChild(hRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  tasks.forEach((task, index) => {
    const row = document.createElement("tr");
    row.style.backgroundColor = index % 2 === 0 ? "#ffffff" : "#f8fafc";

    [task.assigneeId || "Unassigned", task.title, task.description || "-", task.status, task.deadline ? new Date(task.deadline).toLocaleDateString() : "-"].forEach((text) => {
      const td = document.createElement("td");
      td.innerText = text;
      td.style.padding = "12px";
      td.style.borderBottom = "1px solid #e2e8f0";
      td.style.fontSize = "14px";
      row.appendChild(td);
    });
    tbody.appendChild(row);
  });
  table.appendChild(tbody);
  container.appendChild(table);

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      backgroundColor: "#ffffff",
      scale: 2,
      logging: false,
      useCORS: true,
    });

    const image = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = image;
    link.download = `project_report_${new Date().toISOString().slice(0, 10)}.png`;
    link.click();
  } finally {
    document.body.removeChild(container);
  }
}
