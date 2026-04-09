export const getInitialStatusArray = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return Array(daysInMonth).fill("none");
};

export const dashboardMetrics = [
  { id: 1, label: 'SAFETY',   letter: 'S', value: '14',  unit: 'Days without Injuries',  alerts: 0, success: 0 },
  { id: 2, label: 'QUALITY',  letter: 'Q', value: '20%', unit: 'Product Defect Rate',     alerts: 0, success: 0 },
  { id: 3, label: 'DELIVERY', letter: 'D', value: '5%',  unit: 'Budget Adherence',        alerts: 0, success: 0 },
  { id: 4, label: 'HEALTH',   letter: 'H', value: '84%', unit: 'On-Time Delivery Rate',   alerts: 0, success: 0 },
  { id: 5, label: 'IDEA',     letter: 'I', value: '6hr', unit: 'Training & Development',  alerts: 0, success: 0 },
].map(metric => ({
  ...metric,
  daysData: getInitialStatusArray(),
  issueLogs: [],
}));