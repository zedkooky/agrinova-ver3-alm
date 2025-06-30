import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import FarmersTable from './components/FarmersTable';
import IVRLogs from './components/IVRLogs';
import SatelliteInsights from './components/SatelliteInsights';
import CarbonDashboard from './components/CarbonDashboard';
import Settings from './components/Settings';
import AuthForm from './components/AuthForm';
import { supabase } from './lib/supabase';
import { DashboardStats } from './types';
import { User } from '@supabase/supabase-js';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [farmers, setFarmers] = useState<any[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalFarmers: 0,
    totalIVRCalls: 0,
    totalSatelliteInsights: 0,
    totalCarbonOptIns: 0,
  });

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        loadData();
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadData();
      } else {
        setFarmers([]);
        setStats({
          totalFarmers: 0,
          totalIVRCalls: 0,
          totalSatelliteInsights: 0,
          totalCarbonOptIns: 0,
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadData = async () => {
    try {
      // Load farmers
      const { data: farmersData, error: farmersError } = await supabase
        .from('farmers')
        .select('*')
        .order('created_at', { ascending: false });

      if (farmersError) throw farmersError;
      setFarmers(farmersData || []);

      // Load stats
      const [ivrCalls, satelliteInsights, carbonCredits] = await Promise.all([
        supabase.from('ivr_calls').select('id', { count: 'exact' }),
        supabase.from('satellite_insights').select('id', { count: 'exact' }),
        supabase.from('carbon_credits').select('id', { count: 'exact' })
      ]);

      setStats({
        totalFarmers: farmersData?.length || 0,
        totalIVRCalls: ivrCalls.count || 0,
        totalSatelliteInsights: satelliteInsights.count || 0,
        totalCarbonOptIns: carbonCredits.count || 0,
      });

    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard stats={stats} farmers={farmers} />;
      case 'farmers':
        return <FarmersTable farmers={farmers} onFarmerUpdate={loadData} />;
      case 'ivr-logs':
        return <IVRLogs farmers={farmers} />;
      case 'satellite':
        return <SatelliteInsights farmers={farmers} />;
      case 'carbon':
        return <CarbonDashboard />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard stats={stats} farmers={farmers} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm onAuthSuccess={() => {}} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar 
        currentView={currentView} 
        onViewChange={setCurrentView}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        user={user}
        onSignOut={handleSignOut}
      />
      
      <main className="flex-1 lg:ml-0 p-4 lg:p-8 pt-16 lg:pt-8">
        <div className="max-w-7xl mx-auto">
          {renderCurrentView()}
        </div>
      </main>

      {/* Bolt.new Badge */}
      <div className="fixed bottom-4 right-4 z-50">
        <a 
          href="https://bolt.new/?rid=os72mi" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="block transition-all duration-300 hover:shadow-2xl"
        >
          <img 
            src="https://storage.bolt.army/black_circle_360x360.png" 
            alt="Built with Bolt.new badge" 
            className="w-20 h-20 md:w-28 md:h-28 rounded-full shadow-lg bolt-badge bolt-badge-intro" 
            onAnimationEnd={(e) => e.currentTarget.classList.add('animated')}
          />
        </a>
      </div>
    </div>
  );
}

export default App;