#!/usr/bin/env node
// scripts/project-health-check.js
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

console.log('🎵 Interactive Music 3D - Project Health Check\n')

const checks = [
  {
    name: 'Dependencies Audit',
    test: () => {
      try {
        execSync('npm audit', { stdio: 'pipe' })
        return { status: 'pass', message: 'No vulnerabilities found' }
      } catch (error) {
        const output = error.stdout.toString()
        const criticalCount = (output.match(/critical/g) || []).length
        const highCount = (output.match(/high/g) || []).length
        
        if (criticalCount > 0) {
          return { status: 'fail', message: `${criticalCount} critical vulnerabilities found` }
        } else if (highCount > 3) {
          return { status: 'warn', message: `${highCount} high vulnerabilities found` }
        } else {
          return { status: 'warn', message: 'Some low/moderate vulnerabilities found' }
        }
      }
    }
  },
  {
    name: 'Build Test',
    test: () => {
      try {
        execSync('npm run build', { stdio: 'pipe' })
        return { status: 'pass', message: 'Build successful' }
      } catch (error) {
        return { status: 'fail', message: 'Build failed' }
      }
    }
  },
  {
    name: 'Linting',
    test: () => {
      try {
        const output = execSync('npm run lint:check', { stdio: 'pipe' }).toString()
        const warningCount = (output.match(/warning/g) || []).length
        const errorCount = (output.match(/error/g) || []).length
        
        if (errorCount > 0) {
          return { status: 'fail', message: `${errorCount} linting errors found` }
        } else if (warningCount > 10) {
          return { status: 'warn', message: `${warningCount} linting warnings found` }
        } else {
          return { status: 'pass', message: `Linting passed (${warningCount} warnings)` }
        }
      } catch (error) {
        return { status: 'fail', message: 'Linting failed' }
      }
    }
  },
  {
    name: 'Documentation Coverage',
    test: () => {
      const requiredDocs = [
        'docs/SECURITY.md',
        'docs/PERFORMANCE.md',
        'docs/DEPLOYMENT.md',
        'docs/ROADMAP.md',
        'docs/ISSUES.md'
      ]
      
      const missingDocs = requiredDocs.filter(doc => !fs.existsSync(doc))
      
      if (missingDocs.length === 0) {
        return { status: 'pass', message: 'All documentation files present' }
      } else {
        return { status: 'warn', message: `Missing: ${missingDocs.join(', ')}` }
      }
    }
  },
  {
    name: 'Environment Configuration',
    test: () => {
      const hasNextConfig = fs.existsSync('next.config.js')
      const hasTailwindConfig = fs.existsSync('tailwind.config.js')
      const hasVitestConfig = fs.existsSync('vitest.config.ts')
      
      if (hasNextConfig && hasTailwindConfig && hasVitestConfig) {
        return { status: 'pass', message: 'All config files present' }
      } else {
        const missing = []
        if (!hasNextConfig) missing.push('next.config.js')
        if (!hasTailwindConfig) missing.push('tailwind.config.js')
        if (!hasVitestConfig) missing.push('vitest.config.ts')
        return { status: 'warn', message: `Missing: ${missing.join(', ')}` }
      }
    }
  },
  {
    name: 'Security Headers',
    test: () => {
      try {
        const nextConfig = fs.readFileSync('next.config.js', 'utf8')
        const hasSecurityHeaders = nextConfig.includes('X-Frame-Options') && 
                                  nextConfig.includes('X-Content-Type-Options')
        
        if (hasSecurityHeaders) {
          return { status: 'pass', message: 'Security headers configured' }
        } else {
          return { status: 'warn', message: 'Security headers missing' }
        }
      } catch {
        return { status: 'fail', message: 'Could not check security headers' }
      }
    }
  }
]

// Run all checks
const results = checks.map(check => {
  console.log(`Checking ${check.name}...`)
  const result = check.test()
  
  const icon = {
    'pass': '✅',
    'warn': '⚠️',
    'fail': '❌'
  }[result.status]
  
  console.log(`${icon} ${check.name}: ${result.message}`)
  return { ...check, result }
})

console.log('\n📊 Summary:')
const passCount = results.filter(r => r.result.status === 'pass').length
const warnCount = results.filter(r => r.result.status === 'warn').length
const failCount = results.filter(r => r.result.status === 'fail').length

console.log(`✅ Pass: ${passCount}`)
console.log(`⚠️  Warn: ${warnCount}`)
console.log(`❌ Fail: ${failCount}`)

if (failCount > 0) {
  console.log('\n🚨 Critical issues found. Please address failures before deployment.')
  process.exit(1)
} else if (warnCount > 2) {
  console.log('\n⚠️  Several warnings found. Consider addressing them.')
  process.exit(0)
} else {
  console.log('\n🎉 Project health check passed!')
  process.exit(0)
}
