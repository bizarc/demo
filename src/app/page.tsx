import Link from 'next/link';
import { FlaskConical, Radar, BookOpen, Gauge } from 'lucide-react';
import { RecentDemos } from '@/components/home/HomePageContent';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { TopNav } from '@/components/ui/TopNav';
import { Divider } from '@/components/ui/Divider';

/**
 * Home / Landing Page — Funnel Finished Platform
 *
 * Per Funnel Spec v3: Clear entry points for:
 * - Internal Ops (Command Deck): LAB, RADAR, BLUEPRINT, MISSION CONTROL
 * - Client Portal (Scoreboard): Coming soon
 *
 * Uses only components from src/components/ui and design system styles.
 */
export default function HomePage() {
  return (
    <div className="min-h-screen bg-canvas">
      <TopNav
        title="Funnel Finished"
        subtitle="AI-powered marketing delivery"
      />

      <main className="mx-auto max-w-6xl px-6 py-10">
        {/* Hero — Display 36px per DESIGN.md */}
        <section className="mb-12">
          <h2 className="mb-2 text-4xl font-semibold leading-tight tracking-tight text-foreground">
            Welcome to the Command Deck
          </h2>
          <p className="mb-8 max-w-2xl text-sm font-normal leading-normal text-foreground-secondary">
            Internal operations hub for prospecting, building demos, and managing
            live agent infrastructure.
          </p>
        </section>

        {/* Internal Ops — Module Cards */}
        <section className="mb-12">
          <h3 className="mb-4 text-xl font-medium text-foreground">
            Internal ops
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/lab">
              <Card
                variant="interactive"
                padding="lg"
                className="h-full transition-all hover:shadow-sm"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-primary [&_svg]:text-white">
                  <FlaskConical size={20} strokeWidth={2} />
                </div>
                <h4 className="mb-1 text-base font-medium text-foreground">THE LAB</h4>
                <p className="text-sm text-foreground-secondary">
                  Build demos, scrape sites, generate Magic Links for prospects
                </p>
                <div className="mt-3">
                  <Badge variant="live" size="sm">
                    Active
                  </Badge>
                </div>
              </Card>
            </Link>

            <Card variant="default" padding="lg" className="h-full opacity-75">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-border-subtle">
                <Radar size={20} strokeWidth={2} className="text-foreground-secondary" />
              </div>
              <h4 className="mb-1 text-base font-medium text-foreground">RADAR</h4>
              <p className="text-sm text-foreground-secondary">
                Prospecting, target acquisition, campaign signals
              </p>
              <Badge variant="draft" size="sm" className="mt-3">
                Coming soon
              </Badge>
            </Card>

            <Card variant="default" padding="lg" className="h-full opacity-75">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-border-subtle">
                <BookOpen size={20} strokeWidth={2} className="text-foreground-secondary" />
              </div>
              <h4 className="mb-1 text-base font-medium text-foreground">BLUEPRINT</h4>
              <p className="text-sm text-foreground-secondary">
                Mission profiles, The Vault, logic mapping
              </p>
              <Badge variant="draft" size="sm" className="mt-3">
                Coming soon
              </Badge>
            </Card>

            <Card variant="default" padding="lg" className="h-full opacity-75">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-border-subtle">
                <Gauge size={20} strokeWidth={2} className="text-foreground-secondary" />
              </div>
              <h4 className="mb-1 text-base font-medium text-foreground">
                Mission Control
              </h4>
              <p className="text-sm text-foreground-secondary">
                Data Airlock, pilot execution, kill switch
              </p>
              <Badge variant="draft" size="sm" className="mt-3">
                Coming soon
              </Badge>
            </Card>
          </div>
        </section>

        {/* Client Portal */}
        <section className="mb-12">
          <h3 className="mb-4 text-xl font-medium text-foreground">
            Client Portal
          </h3>
          <Card variant="default" padding="lg">
            <p className="text-sm text-foreground-secondary">
              Streamlined dashboard for clients to view metrics, ROI, and
              conversation logs. White-label Scoreboard experience.
            </p>
            <Badge variant="draft" size="sm" className="mt-3">
              Coming soon
            </Badge>
          </Card>
        </section>

        {/* Recent demos + Quick actions */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-medium text-foreground">
              Your demos
            </h3>
            <Link href="/lab">
              <Button variant="primary" size="md">
                Open THE LAB
              </Button>
            </Link>
          </div>
          <Card variant="default" padding="lg">
            <RecentDemos />
            <div className="mt-4 pt-4">
              <Divider className="my-0" />
              <Link
                href="/lab"
                className="mt-4 block text-sm font-normal text-primary hover:underline"
              >
                Manage all demos →
              </Link>
            </div>
          </Card>
        </section>
      </main>
    </div>
  );
}
