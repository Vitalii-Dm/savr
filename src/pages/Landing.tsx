import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, 
  Brain, 
  Search, 
  Users, 
  Coffee, 
  UtensilsCrossed, 
  Footprints,
  Target,
  Zap,
  TrendingUp,
  Sparkles,
  Award,
  Trophy,
  Bot,
  MessageCircle,
  ArrowRight,
  CheckCircle,
  BarChart3,
  PieChart
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

const Landing = () => {
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [points, setPoints] = useState(0);
  const [collectiveSavings, setCollectiveSavings] = useState(0);

  // Animated count-up effect
  useEffect(() => {
    const targetBalance = 2847;
    const targetPoints = 1250;
    const targetCollective = 234567;
    const duration = 2000;
    const steps = 60;
    const increment = duration / steps;

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      setBalance(Math.floor(targetBalance * progress));
      setPoints(Math.floor(targetPoints * progress));
      setCollectiveSavings(Math.floor(targetCollective * progress));

      if (currentStep >= steps) {
        clearInterval(timer);
        setBalance(targetBalance);
        setPoints(targetPoints);
        setCollectiveSavings(targetCollective);
      }
    }, increment);

    return () => clearInterval(timer);
  }, []);

  const challenges = [
    { icon: Coffee, text: "Skip 2 coffee runs this week", points: 50, progress: 30 },
    { icon: UtensilsCrossed, text: "Cook 3 meals at home", points: 75, progress: 66 },
    { icon: Footprints, text: "Walk instead of Uber once", points: 100, progress: 0 }
  ];

  const tiers = [
    { name: "Bronze", points: "0-499", gradient: "tier-bronze", rewards: ["Student discounts", "Cashback vouchers"] },
    { name: "Silver", points: "500-1,499", gradient: "tier-silver", rewards: ["Restaurant deals", "Cinema passes"] },
    { name: "Gold", points: "1,500-4,999", gradient: "tier-gold", rewards: ["Luxury experiences", "Weekend getaways"] },
    { name: "Platinum", points: "5,000+", gradient: "tier-platinum", rewards: ["Premium gyms", "Designer rentals"] }
  ];

  const insights = [
    { icon: Upload, title: "Upload Bank Statement", desc: "AI categorizes every transaction automatically" },
    { icon: Search, title: "Find Hidden Patterns", desc: "Discover spending trends you never noticed" },
    { icon: CheckCircle, title: "Spot Forgotten Subscriptions", desc: "Cancel what you don't use anymore" },
    { icon: Users, title: "Compare to Students Like You", desc: "See how you stack up against peers" }
  ];

  const differentiators = [
    { icon: PieChart, title: "Real Bank Data", desc: "No manual input required" },
    { icon: Bot, title: "AI-Powered Insights", desc: "Finds patterns, not just totals" },
    { icon: Award, title: "Tangible Perks", desc: "Every action earns rewards" },
    { icon: MessageCircle, title: "Finance-Savvy Friend", desc: "Not a boring spreadsheet" }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-hero opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-b from-accent/10 via-transparent to-background/50" />
        
        <div className="relative z-10 container mx-auto px-6 text-center">
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-6 animate-count-up">
            Your Student Finances.<br />
            <span className="bg-gradient-to-r from-accent to-success bg-clip-text text-transparent">
              Smarter. Rewarded.
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto">
            AI that helps you spend better, save faster, and earn real rewards.
          </p>

          {/* Balance & Points Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-12">
            <div className="glass-card rounded-2xl p-8 hover-lift">
              <p className="text-sm text-muted-foreground mb-2">Current Balance</p>
              <p className="text-5xl font-bold font-mono">£{balance.toLocaleString()}</p>
            </div>
            <div className="glass-card rounded-2xl p-8 hover-lift">
              <p className="text-sm text-muted-foreground mb-2">Reward Points</p>
              <p className="text-5xl font-bold font-mono text-accent">{points.toLocaleString()}</p>
              <span className="inline-block px-3 py-1 bg-silver/20 rounded-full text-xs mt-2">Silver Tier</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => navigate("/upload")}
              size="lg"
              className="text-lg px-8 py-6 bg-gradient-to-r from-accent to-success hover:opacity-90 transition-all hover-glow"
            >
              Upload CSV
              <Upload className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              onClick={() => navigate("/rewards")}
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6 border-accent/50 hover:bg-accent/10 hover:border-accent transition-all"
            >
              View Rewards
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* CSV Intelligence Engine */}
      <section className="py-24 bg-card/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4">Your Spending, Decoded.</h2>
            <p className="text-xl text-muted-foreground">Upload once. Understand everything.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {insights.map((insight, index) => {
              const Icon = insight.icon;
              return (
                <Card 
                  key={index}
                  className="glass-card p-8 hover-lift hover-glow transition-all"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="bg-accent/20 rounded-full w-14 h-14 flex items-center justify-center mb-6">
                    <Icon className="h-7 w-7 text-accent" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{insight.title}</h3>
                  <p className="text-muted-foreground">{insight.desc}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Smart Challenges */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4">Turn Small Changes into Big Wins.</h2>
            <p className="text-xl text-muted-foreground">Complete challenges. Build streaks. Earn rewards.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {challenges.map((challenge, index) => {
              const Icon = challenge.icon;
              return (
                <Card key={index} className="glass-card p-8 hover-lift transition-all">
                  <div className="flex items-start justify-between mb-6">
                    <div className="bg-accent/20 rounded-full w-12 h-12 flex items-center justify-center">
                      <Icon className="h-6 w-6 text-accent" />
                    </div>
                    <div className="bg-accent/20 rounded-full px-3 py-1 text-sm font-semibold text-accent">
                      +{challenge.points} pts
                    </div>
                  </div>
                  
                  <p className="text-lg font-medium mb-4">{challenge.text}</p>
                  
                  {/* Progress Circle */}
                  <div className="relative w-24 h-24 mx-auto mb-4">
                    <svg className="transform -rotate-90 w-24 h-24">
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        className="text-muted/20"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 40}`}
                        strokeDashoffset={`${2 * Math.PI * 40 * (1 - challenge.progress / 100)}`}
                        className="text-accent transition-all duration-1000"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold">{challenge.progress}%</span>
                    </div>
                  </div>

                  {challenge.progress > 0 && (
                    <div className="flex items-center justify-center gap-1 text-sm text-accent">
                      <Zap className="h-4 w-4" />
                      <span>3-day streak</span>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tiered Rewards */}
      <section className="py-24 bg-card/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4">Earn Rewards That Matter.</h2>
            <p className="text-xl text-muted-foreground">From student discounts to luxury experiences.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {tiers.map((tier, index) => (
              <Card 
                key={index}
                className={`${tier.gradient} p-8 hover-lift transition-all relative overflow-hidden animate-shine`}
                style={{ 
                  backgroundSize: '200% 200%',
                  animationDelay: `${index * 500}ms`
                }}
              >
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold mb-2 text-foreground">{tier.name}</h3>
                  <p className="text-sm text-foreground/80 mb-6">{tier.points} pts</p>
                  
                  <div className="space-y-2">
                    {tier.rewards.map((reward, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-foreground/80" />
                        <span className="text-sm text-foreground/90">{reward}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="max-w-3xl mx-auto">
            <div className="glass-card rounded-2xl p-8">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-muted-foreground">Current: Silver (1,250 pts)</span>
                <span className="text-sm text-accent font-semibold">250 pts to Gold</span>
              </div>
              <Progress value={83} className="h-3 mb-2" />
              <p className="text-center text-muted-foreground mt-4">
                You're <span className="text-accent font-semibold">230 points</span> away from Gold — where perks get serious ✨
              </p>
              <Button className="w-full mt-6 bg-accent hover:bg-accent/90" onClick={() => navigate("/rewards")}>
                Redeem Rewards
                <Award className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Spending Insights */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4">AI-Powered Intelligence.</h2>
            <p className="text-xl text-muted-foreground">Predictive insights that help you stay ahead.</p>
          </div>

          <div className="max-w-4xl mx-auto glass-card rounded-2xl p-12">
            <div className="flex items-center justify-center mb-8">
              <BarChart3 className="h-32 w-32 text-accent animate-pulse" />
            </div>
            
            <div className="space-y-4 text-center">
              <p className="text-lg">
                <span className="text-muted-foreground">Based on your habits, you'll spend</span>
                <span className="text-3xl font-bold text-accent mx-2">£847</span>
                <span className="text-muted-foreground">next month.</span>
              </p>
              <p className="text-lg text-muted-foreground">
                Switch to Lidl → save <span className="text-success font-semibold">£42/mo</span>
              </p>
            </div>

            <Button 
              variant="outline" 
              className="w-full mt-8 border-accent/50 hover:bg-accent/10"
              onClick={() => navigate("/insights")}
            >
              View Full Insights
              <TrendingUp className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Why It's Different */}
      <section className="py-24 bg-card/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4">Smarter Than Any Budget App.</h2>
            <p className="text-xl text-muted-foreground">Built for students who want more than spreadsheets.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {differentiators.map((item, index) => {
              const Icon = item.icon;
              return (
                <Card key={index} className="glass-card p-8 text-center hover-lift transition-all">
                  <div className="bg-accent/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                    <Icon className="h-8 w-8 text-accent" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.desc}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Social & Impact */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4">Together, We Save More.</h2>
            <p className="text-xl text-muted-foreground">Join thousands of students taking control.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Leaderboard */}
            <Card className="glass-card p-8">
              <div className="flex items-center gap-3 mb-6">
                <Trophy className="h-8 w-8 text-gold" />
                <h3 className="text-xl font-semibold">Top Savers</h3>
              </div>
              <div className="space-y-3">
                {['Alex M.', 'Sarah K.', 'James P.'].map((name, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-muted-foreground">#{i + 1} {name}</span>
                    <span className="font-semibold text-accent">£{(543 - i * 50).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Collective Impact */}
            <Card className="glass-card p-8 md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <Users className="h-8 w-8 text-accent" />
                <h3 className="text-xl font-semibold">Collective Impact</h3>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">PRISM users saved collectively</p>
                <p className="text-5xl font-bold text-accent font-mono mb-4">
                  £{collectiveSavings.toLocaleString()}
                </p>
                <Button variant="outline" className="border-accent/50 hover:bg-accent/10">
                  Challenge a Friend
                  <Sparkles className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-gradient-to-r from-accent/20 via-success/20 to-accent/20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-5xl font-bold mb-6">
            Join thousands of students saving smarter with PRISM.
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Upload your first statement and start earning rewards today.
          </p>
          <Button 
            size="lg"
            onClick={() => navigate("/upload")}
            className="text-lg px-12 py-6 bg-accent hover:bg-accent/90 hover-glow transition-all"
          >
            Upload CSV to Start Saving
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border/50">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">© 2025 PRISM. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About</a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
