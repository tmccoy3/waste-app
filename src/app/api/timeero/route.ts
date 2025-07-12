import { NextRequest, NextResponse } from 'next/server'
import { 
  getUsers, 
  getGpsData, 
  getMileage, 
  getTimesheets, 
  getScheduledJobs,
  getRouteAnalysisData,
  getTeamPerformanceData 
} from '../../../lib/api/timeero'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const userId = searchParams.get('userId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const userIds = searchParams.get('userIds')

    console.log(`🕐 Timeero API endpoint called with action: ${action}`)

    // Validate required parameters for most actions
    if (action !== 'users' && (!userId || !startDate || !endDate)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required parameters. userId, startDate, and endDate are required for most actions.' 
        },
        { status: 400 }
      )
    }

    switch (action) {
      case 'users':
        console.log('👥 Fetching all Timeero users...')
        const users = await getUsers()
        return NextResponse.json({
          success: true,
          data: users,
          count: users.length
        })

      case 'gps':
        console.log(`📍 Fetching GPS data for user ${userId}...`)
        const gpsData = await getGpsData(parseInt(userId!), startDate!, endDate!)
        return NextResponse.json({
          success: true,
          data: gpsData,
          count: gpsData.length,
          dateRange: { startDate, endDate }
        })

      case 'mileage':
        console.log(`🚗 Fetching mileage data for user ${userId}...`)
        const mileageData = await getMileage(parseInt(userId!), startDate!, endDate!)
        return NextResponse.json({
          success: true,
          data: mileageData,
          count: mileageData.length,
          totalMiles: mileageData.reduce((sum, entry) => sum + entry.distance_miles, 0),
          dateRange: { startDate, endDate }
        })

      case 'timesheets':
        console.log(`⏰ Fetching timesheet data for user ${userId}...`)
        const timesheetData = await getTimesheets(parseInt(userId!), startDate!, endDate!)
        return NextResponse.json({
          success: true,
          data: timesheetData,
          count: timesheetData.length,
          totalHours: timesheetData.reduce((sum, entry) => {
            // Convert duration string (e.g., "14:20") to hours
            const [hours, minutes] = entry.duration.split(':').map(Number);
            const totalHours = hours + (minutes || 0) / 60;
            return sum + totalHours;
          }, 0),
          dateRange: { startDate, endDate }
        })

      case 'jobs':
        console.log(`📋 Fetching scheduled jobs for user ${userId}...`)
        const jobsData = await getScheduledJobs(parseInt(userId!), startDate!, endDate!)
        return NextResponse.json({
          success: true,
          data: jobsData,
          count: jobsData.length,
          completedJobs: jobsData.filter(job => job.status === 'completed').length,
          dateRange: { startDate, endDate }
        })

      case 'route-analysis':
        console.log(`🔄 Fetching comprehensive route analysis for user ${userId}...`)
        const routeData = await getRouteAnalysisData(parseInt(userId!), startDate!, endDate!)
        
                 // Calculate summary statistics
         const summary = {
           totalGpsPoints: routeData.gpsData.length,
           totalMiles: routeData.mileage.reduce((sum, entry) => sum + entry.distance_miles, 0),
           totalHours: routeData.timesheets.reduce((sum, entry) => {
             // Convert duration string (e.g., "14:20") to hours
             const [hours, minutes] = entry.duration.split(':').map(Number);
             const totalHours = hours + (minutes || 0) / 60;
             return sum + totalHours;
           }, 0),
           completedJobs: routeData.scheduledJobs.filter(job => job.status === 'completed').length,
           avgSpeed: 0,
           routeEfficiency: 'medium' as 'high' | 'medium' | 'low'
         }

        // Calculate average speed if we have both mileage and time data
        if (summary.totalMiles > 0 && summary.totalHours > 0) {
          summary.avgSpeed = summary.totalMiles / summary.totalHours
          
          // Simple efficiency calculation
          if (summary.avgSpeed > 15 && summary.completedJobs > 5) {
            summary.routeEfficiency = 'high'
          } else if (summary.avgSpeed < 8 || summary.completedJobs < 3) {
            summary.routeEfficiency = 'low'
          }
        }

        return NextResponse.json({
          success: true,
          data: routeData,
          summary,
          dateRange: { startDate, endDate }
        })

      case 'team-performance':
        if (!userIds) {
          return NextResponse.json(
            { success: false, error: 'userIds parameter is required for team performance data' },
            { status: 400 }
          )
        }
        
        console.log(`👥 Fetching team performance data...`)
        const userIdArray = userIds.split(',').map(id => parseInt(id.trim()))
        const teamData = await getTeamPerformanceData(userIdArray, startDate!, endDate!)
        
        // Calculate team summary
        const teamSummary = {
          totalUsers: teamData.length,
          activeUsers: teamData.filter(user => user.totalHours > 0).length,
          totalTeamHours: teamData.reduce((sum, user) => sum + user.totalHours, 0),
          totalTeamMiles: teamData.reduce((sum, user) => sum + user.totalMiles, 0),
          totalCompletedJobs: teamData.reduce((sum, user) => sum + user.completedJobs, 0),
          avgHoursPerUser: 0,
          avgMilesPerUser: 0
        }

        if (teamSummary.activeUsers > 0) {
          teamSummary.avgHoursPerUser = teamSummary.totalTeamHours / teamSummary.activeUsers
          teamSummary.avgMilesPerUser = teamSummary.totalTeamMiles / teamSummary.activeUsers
        }

        return NextResponse.json({
          success: true,
          data: teamData,
          summary: teamSummary,
          dateRange: { startDate, endDate }
        })

      default:
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid action. Supported actions: users, gps, mileage, timesheets, jobs, route-analysis, team-performance' 
          },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('💥 Timeero API endpoint error:', error)
    
    let errorMessage = 'Internal server error'
    if (error instanceof Error) {
      errorMessage = error.message
    }

    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, userId, userIds, startDate, endDate, ...additionalParams } = body

    console.log(`🕐 Timeero API POST endpoint called with action: ${action}`)

    // Handle bulk operations that are better suited for POST
    switch (action) {
      case 'bulk-route-analysis':
        if (!userIds || !Array.isArray(userIds)) {
          return NextResponse.json(
            { success: false, error: 'userIds array is required for bulk route analysis' },
            { status: 400 }
          )
        }

        console.log(`🔄 Fetching bulk route analysis for ${userIds.length} users...`)
        
        const bulkRouteData = []
        for (const uid of userIds) {
          try {
            const routeData = await getRouteAnalysisData(uid, startDate, endDate)
            bulkRouteData.push({
              userId: uid,
              ...routeData
            })
          } catch (error) {
            console.error(`❌ Failed to fetch route data for user ${uid}:`, error)
            bulkRouteData.push({
              userId: uid,
              user: null,
              gpsData: [],
              mileage: [],
              timesheets: [],
              scheduledJobs: [],
              error: error instanceof Error ? error.message : 'Unknown error'
            })
          }
        }

        return NextResponse.json({
          success: true,
          data: bulkRouteData,
          count: bulkRouteData.length,
          dateRange: { startDate, endDate }
        })

      default:
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid POST action. Supported actions: bulk-route-analysis' 
          },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('💥 Timeero API POST endpoint error:', error)
    
    let errorMessage = 'Internal server error'
    if (error instanceof Error) {
      errorMessage = error.message
    }

    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
} 