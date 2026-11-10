import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

export default function SummaryChart({ stats }){
  const barData = {
    labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    datasets: [{ label: 'Completed Habits', data: [2,3,1,4,3,5, stats.today_completed], backgroundColor: '#4CAF50' }]
  };
  const doughnutData = {
    labels: ['Completed','Pending'],
    datasets: [{ data: [stats.today_completed, stats.today_total - stats.today_completed], backgroundColor: ['#4CAF50','#E0E0E0'] }]
  };
  return (
    <div style={{display:'flex', gap:'20px'}}>
      <div style={{width:'60%'}}><Bar data={barData} /></div>
      <div style={{width:'30%'}}><Doughnut data={doughnutData} /></div>
    </div>
  )
}