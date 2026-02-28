import PomodoroTimer from '@/components/PomodoroTimer';

const TimerPage = () => (
  <div>
    <h2 className="text-xl font-semibold mb-6">Pomodoro Timer</h2>
    <div className="max-w-xl mx-auto">
      <PomodoroTimer />
    </div>
  </div>
);

export default TimerPage;
