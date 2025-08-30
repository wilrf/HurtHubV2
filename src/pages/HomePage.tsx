import { Card, CardHeader, CardTitle, CardContent, StatsCard } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useTheme } from '@/contexts/ThemeContext'
import { 
  Building2, 
  TrendingUp, 
  Users, 
  DollarSign,
  Activity,
  ArrowUpRight,
  MapPin,
  Calendar
} from 'lucide-react'

export function HomePage() {
  const { isDarkMode } = useTheme()

  // Mock data - will be replaced with real data from API
  const stats = {
    totalCompanies: 12543,
    totalInvestments: 1247,
    totalEmployees: 125430,
    recentDevelopments: 23,
    growthRate: 12.5,
    marketValue: 2547000000,
  }

  const recentNews = [
    {
      id: 1,
      title: 'Major Tech Company Announces 500 New Jobs in Charlotte',
      category: 'Investment',
      time: '2 hours ago',
      impact: 'high'
    },
    {
      id: 2,
      title: 'New Healthcare Facility Breaks Ground in South End',
      category: 'Development',
      time: '5 hours ago', 
      impact: 'medium'
    },
    {
      id: 3,
      title: 'Financial Services Sector Shows Strong Q3 Growth',
      category: 'Market',
      time: '1 day ago',
      impact: 'medium'
    }
  ]

  return (
    <div className='p-6 space-y-6'>
      {/* Welcome Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight text-foreground'>
            Welcome to Charlotte EconDev
          </h1>
          <p className='text-muted-foreground mt-2'>
            Real-time economic intelligence for the Greater Charlotte metropolitan area
          </p>
        </div>
        <Badge variant={isDarkMode ? 'glass' : 'outline'} className='px-3 py-1'>
          <Activity className='h-4 w-4 mr-1' />
          Live Data
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <StatsCard
          title='Total Companies'
          value={stats.totalCompanies.toLocaleString()}
          change={5.2}
          description='Active businesses in Charlotte metro'
          icon={<Building2 className='h-6 w-6' />}
          variant={isDarkMode ? 'glass' : 'default'}
        />
        
        <StatsCard
          title='Recent Investments'
          value={`$${(stats.marketValue / 1000000000).toFixed(1)}B`}
          change={12.5}
          description='Total investment value this year'
          icon={<DollarSign className='h-6 w-6' />}
          variant={isDarkMode ? 'glass' : 'default'}
        />
        
        <StatsCard
          title='Total Employment'
          value={stats.totalEmployees.toLocaleString()}
          change={8.3}
          description='Jobs across all tracked companies'
          icon={<Users className='h-6 w-6' />}
          variant={isDarkMode ? 'glass' : 'default'}
        />
        
        <StatsCard
          title='Growth Rate'
          value={`${stats.growthRate}%`}
          change={2.1}
          description='Year-over-year economic growth'
          icon={<TrendingUp className='h-6 w-6' />}
          variant={isDarkMode ? 'glass' : 'default'}
        />
      </div>

      {/* Main Content Grid */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Recent News & Developments */}
        <Card variant={isDarkMode ? 'glass' : 'default'} className='lg:col-span-2'>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <CardTitle className='flex items-center gap-2'>
                <Activity className='h-5 w-5' />
                Recent Developments
              </CardTitle>
              <Button variant='ghost' size='sm'>
                View All
                <ArrowUpRight className='h-4 w-4 ml-1' />
              </Button>
            </div>
          </CardHeader>
          <CardContent className='space-y-4'>
            {recentNews.map((item) => (
              <div 
                key={item.id}
                className={`flex items-start space-x-4 p-4 rounded-xl border transition-colors duration-200 hover:bg-accent cursor-pointer ${
                  isDarkMode ? 'border-midnight-700 hover:bg-midnight-800' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className={`p-2 rounded-lg ${
                  item.impact === 'high' 
                    ? 'bg-success/10 text-success' 
                    : 'bg-primary/10 text-primary'
                }`}>
                  <MapPin className='h-4 w-4' />
                </div>
                <div className='flex-1 min-w-0'>
                  <h4 className='font-medium text-foreground line-clamp-2'>
                    {item.title}
                  </h4>
                  <div className='flex items-center gap-2 mt-2 text-sm text-muted-foreground'>
                    <Badge variant='outline' size='sm'>
                      {item.category}
                    </Badge>
                    <span className='flex items-center gap-1'>
                      <Calendar className='h-3 w-3' />
                      {item.time}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card variant={isDarkMode ? 'glass' : 'default'}>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            <Button 
              variant={isDarkMode ? 'glass' : 'default'} 
              className='w-full justify-start'
            >
              <Building2 className='h-4 w-4 mr-2' />
              Search Companies
            </Button>
            <Button 
              variant={isDarkMode ? 'ghost' : 'outline'} 
              className='w-full justify-start'
            >
              <TrendingUp className='h-4 w-4 mr-2' />
              View Market Trends
            </Button>
            <Button 
              variant={isDarkMode ? 'ghost' : 'outline'} 
              className='w-full justify-start'
            >
              <Users className='h-4 w-4 mr-2' />
              Community Pulse
            </Button>
            <Button 
              variant={isDarkMode ? 'ghost' : 'outline'} 
              className='w-full justify-start'
            >
              <Activity className='h-4 w-4 mr-2' />
              AI Assistant
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Bottom CTA Section */}
      <Card variant={isDarkMode ? 'midnight' : 'elevated'} className='text-center'>
        <CardContent className='py-8'>
          <h2 className='text-2xl font-bold mb-2'>
            Ready to explore Charlotte's economic landscape?
          </h2>
          <p className='text-muted-foreground mb-6 max-w-2xl mx-auto'>
            Discover insights about local businesses, track market trends, and stay informed 
            about the latest developments in the Charlotte metropolitan area.
          </p>
          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <Button size='lg' variant={isDarkMode ? 'glass' : 'default'}>
              Explore Business Intelligence
              <ArrowUpRight className='h-4 w-4 ml-2' />
            </Button>
            <Button size='lg' variant='outline'>
              Try AI Assistant
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}export default HomePage
