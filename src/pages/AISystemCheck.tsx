import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Badge } from '@/components/ui/Badge';
import { checkDatabaseHealth, queryBusinessData } from '@/services/aiService';
import MainLayout from '@/components/layouts/MainLayout';

interface HealthCheckResult {
  status: string;
  timestamp: string;
  database: {
    connected: boolean;
    latency: number;
  };
  tables: {
    companies: boolean;
    developments: boolean;
    economic_indicators: boolean;
    ai_conversations: boolean;
    ai_session_summaries: boolean;
  };
  dataCounts: {
    companies: number;
    developments: number;
    economic_indicators: number;
    ai_conversations: number;
    ai_session_summaries: number;
  };
  recommendations: string[];
}

interface TestResult {
  query: string;
  type: string;
  success: boolean;
  data?: any;
  error?: string;
  timestamp: string;
}

const AISystemCheck: React.FC = () => {
  const [healthCheck, setHealthCheck] = useState<HealthCheckResult | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRunningTests, setIsRunningTests] = useState(false);

  useEffect(() => {
    performHealthCheck();
  }, []);

  const performHealthCheck = async () => {
    setIsLoading(true);
    try {
      const result = await checkDatabaseHealth();
      setHealthCheck(result);
    } catch (error) {
      console.error('Health check failed:', error);
      setHealthCheck({
        status: 'error',
        timestamp: new Date().toISOString(),
        database: { connected: false, latency: 0 },
        tables: {
          companies: false,
          developments: false,
          economic_indicators: false,
          ai_conversations: false,
          ai_session_summaries: false
        },
        dataCounts: {
          companies: 0,
          developments: 0,
          economic_indicators: 0,
          ai_conversations: 0,
          ai_session_summaries: 0
        },
        recommendations: ['Failed to connect to database. Check your Supabase configuration.']
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runIntelligenceTests = async () => {
    setIsRunningTests(true);
    const results: TestResult[] = [];

    const testQueries = [
      { query: 'Show me companies in Charlotte', type: 'companies' },
      { query: 'What are the latest business developments', type: 'developments' },
      { query: 'Economic indicators for Charlotte', type: 'economic' },
      { query: 'Give me a comprehensive market overview', type: 'comprehensive' },
      { query: 'Find information about Bank of America', type: 'search' }
    ];

    for (const test of testQueries) {
      try {
        const data = await queryBusinessData(test.query, test.type as any);
        results.push({
          ...test,
          success: true,
          data,
          timestamp: new Date().toISOString()
        });
      } catch (error: any) {
        results.push({
          ...test,
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }

      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setTestResults(results);
    setIsRunningTests(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge variant="success">Healthy</Badge>;
      case 'unhealthy':
        return <Badge variant="error">Unhealthy</Badge>;
      case 'error':
        return <Badge variant="error">Error</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getTableStatus = (available: boolean) => {
    return available ?
      <Badge variant="success">Available</Badge> :
      <Badge variant="error">Unavailable</Badge>;
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI System Diagnostics</h1>
          <p className="text-gray-600">
            Check database connectivity and test AI intelligence capabilities
          </p>
        </div>

        {/* Database Health Check */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Database Health Check</CardTitle>
                <CardDescription>
                  Verify database connectivity and data availability
                </CardDescription>
              </div>
              <Button
                onClick={performHealthCheck}
                disabled={isLoading}
                variant="outline"
              >
                {isLoading ? <LoadingSpinner /> : 'Refresh'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {healthCheck ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Overall Status:</span>
                  {getStatusBadge(healthCheck.status)}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium">Database Connection:</span>
                    <div className="mt-1">
                      {healthCheck.database.connected ?
                        <Badge variant="success">Connected</Badge> :
                        <Badge variant="error">Disconnected</Badge>
                      }
                      {healthCheck.database.latency > 0 && (
                        <span className="ml-2 text-sm text-gray-600">
                          ({healthCheck.database.latency}ms)
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="font-medium">Last Checked:</span>
                    <div className="mt-1 text-sm text-gray-600">
                      {new Date(healthCheck.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div>
                  <span className="font-medium">Table Status:</span>
                  <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
                    {Object.entries(healthCheck.tables).map(([table, available]) => (
                      <div key={table} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm capitalize">{table.replace('_', ' ')}:</span>
                        {getTableStatus(available)}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="font-medium">Data Counts:</span>
                  <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
                    {Object.entries(healthCheck.dataCounts).map(([table, count]) => (
                      <div key={table} className="p-2 bg-blue-50 rounded text-center">
                        <div className="text-lg font-semibold text-blue-600">{count}</div>
                        <div className="text-xs text-gray-600 capitalize">{table.replace('_', ' ')}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {healthCheck.recommendations.length > 0 && (
                  <div>
                    <span className="font-medium">Recommendations:</span>
                    <ul className="mt-2 space-y-1">
                      {healthCheck.recommendations.map((rec, index) => (
                        <li key={index} className="text-sm text-orange-600 bg-orange-50 p-2 rounded">
                          • {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <LoadingSpinner />
                <p className="mt-2 text-gray-600">Checking database health...</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Intelligence Tests */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>AI Intelligence Tests</CardTitle>
                <CardDescription>
                  Test the AI's ability to query and analyze business data
                </CardDescription>
              </div>
              <Button
                onClick={runIntelligenceTests}
                disabled={isRunningTests || !healthCheck?.database.connected}
              >
                {isRunningTests ? <LoadingSpinner /> : 'Run Tests'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!healthCheck?.database.connected ? (
              <div className="text-center py-8 text-gray-600">
                Database connection required to run intelligence tests
              </div>
            ) : testResults.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                Click "Run Tests" to test AI intelligence capabilities
              </div>
            ) : (
              <div className="space-y-4">
                {testResults.map((result, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">{result.query}</span>
                      <div className="flex items-center space-x-2">
                        <Badge variant={result.success ? 'success' : 'error'}>
                          {result.success ? 'Success' : 'Failed'}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {new Date(result.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>

                    {result.success && result.data ? (
                      <div className="text-sm text-gray-600">
                        <div className="mb-2">
                          <strong>Type:</strong> {result.type}
                        </div>
                        <div className="mb-2">
                          <strong>Results:</strong> {result.data.metadata?.resultCount || 'N/A'} items found
                        </div>
                        {result.data.data?.companies && (
                          <div className="text-xs">
                            Sample companies: {result.data.data.companies.slice(0, 2).map((c: any) => c.name).join(', ')}
                          </div>
                        )}
                      </div>
                    ) : result.error ? (
                      <div className="text-sm text-red-600">
                        <strong>Error:</strong> {result.error}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Status Summary */}
        <Card>
          <CardHeader>
            <CardTitle>System Status Summary</CardTitle>
            <CardDescription>Overall AI system health and capabilities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {healthCheck?.database.connected ? '✓' : '✗'}
                </div>
                <div className="text-sm text-gray-600">Database Connection</div>
              </div>

              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {testResults.filter(t => t.success).length}
                </div>
                <div className="text-sm text-gray-600">Successful Tests</div>
              </div>

              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {healthCheck?.dataCounts.companies || 0}
                </div>
                <div className="text-sm text-gray-600">Business Records</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default AISystemCheck;
