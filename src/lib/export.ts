import type { PomodoroSessionRow } from '@/lib/supabase';
import type { WaterLogEntry, WaterSettings, PomodoroSettings } from '@/hooks/useSupabase';

function escapeXml(value: string | number): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function sheetHeader(title: string, columns: string[]): string {
  return `<Table ss:ExpandedColumnCount="${columns.length}" ss:ExpandedRowCount="1" x:FullColumns="1" x:FullRows="1" ss:DefaultRowHeight="15">
<Row>
${columns.map((c) => `  <Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(c)}</Data></Cell>`).join('\n')}
</Row>`;
}

function dataRow(cells: (string | number)[]): string {
  return `<Row>
${cells
  .map((c) => {
    const isNum = typeof c === 'number';
    return `  <Cell><Data ss:Type="${isNum ? 'Number' : 'String'}">${escapeXml(c)}</Data></Cell>`;
  })
  .join('\n')}
</Row>`;
}

function sheetFooter(): string {
  return `</Table>`;
}

export function generateXls(
  waterLog: WaterLogEntry[],
  waterSettings: WaterSettings,
  pomodoroSessions: PomodoroSessionRow[],
  pomodoroSettings: PomodoroSettings,
): string {
  const waterRows = waterLog
    .slice()
    .sort((a, b) => a.timestamp - b.timestamp)
    .map((e) => {
      const d = new Date(e.timestamp);
      return dataRow([
        d.toLocaleDateString(),
        d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        e.amountMl,
        (e.amountMl / 1000).toFixed(2),
      ]);
    })
    .join('\n');

  const pomodoroRows = pomodoroSessions
    .slice()
    .sort((a, b) => new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime())
    .map((s) => {
      const d = new Date(s.completed_at);
      return dataRow([d.toLocaleDateString(), d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), s.duration_minutes]);
    })
    .join('\n');

  const settingsRows = [
    dataRow(['Water reminders enabled', waterSettings.enabled ? 'Yes' : 'No']),
    dataRow(['Reminder interval (min)', waterSettings.intervalMinutes]),
    dataRow(['Daily water goal (ml)', waterSettings.dailyGoalMl]),
    dataRow(['Daily water goal (litres)', (waterSettings.dailyGoalMl / 1000).toFixed(2)]),
    dataRow(['Focus length (min)', pomodoroSettings.focusMinutes]),
    dataRow(['Short break (min)', pomodoroSettings.shortBreakMinutes]),
    dataRow(['Long break (min)', pomodoroSettings.longBreakMinutes]),
    dataRow(['Rounds before long break', pomodoroSettings.roundsBeforeLongBreak]),
  ].join('\n');

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
<Styles>
 <Style ss:ID="Header">
  <Font ss:Bold="1" ss:Size="11"/>
  <Interior ss:Color="#1E293B" ss:Pattern="Solid"/>
  <Font ss:Color="#E2E8F0"/>
 </Style>
</Styles>

<Worksheet ss:Name="Water Log">
${sheetHeader('Water Log', ['Date', 'Time', 'Amount (ml)', 'Amount (litres)'])}
${waterRows || dataRow(['—', 'No entries', 0, '0.00'])}
${sheetFooter()}
</Worksheet>

<Worksheet ss:Name="Pomodoro Sessions">
${sheetHeader('Pomodoro Sessions', ['Date', 'Time', 'Duration (min)'])}
${pomodoroRows || dataRow(['—', 'No sessions', 0])}
${sheetFooter()}
</Worksheet>

<Worksheet ss:Name="Settings">
${sheetHeader('Settings', ['Setting', 'Value'])}
${settingsRows}
${sheetFooter()}
</Worksheet>

</Workbook>`;
}

export function downloadXls(
  waterLog: WaterLogEntry[],
  waterSettings: WaterSettings,
  pomodoroSessions: PomodoroSessionRow[],
  pomodoroSettings: PomodoroSettings,
): void {
  const xml = generateXls(waterLog, waterSettings, pomodoroSessions, pomodoroSettings);
  const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `hydrate-focus-export-${new Date().toISOString().slice(0, 10)}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
