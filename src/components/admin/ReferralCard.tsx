import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Users, Gift, Copy, Share2, TrendingUp, Check } from 'lucide-react';
import { useReferrals } from '@/hooks/useReferrals';

export const ReferralCard = () => {
  const { stats, referrals, loading, copyReferralLink, applyReferralCode } = useReferrals();
  const [referralInput, setReferralInput] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    copyReferralLink();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyCode = async () => {
    if (referralInput.trim()) {
      const success = await applyReferralCode(referralInput.trim());
      if (success) {
        setReferralInput('');
      }
    }
  };

  if (loading) {
    return (
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50 overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-neon-purple/10 rounded-full blur-3xl" />
      
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-display flex items-center gap-2">
          <Users className="h-5 w-5 text-neon-purple" />
          Programa de Indicação
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Share2 className="h-3 w-3" />
              Indicações
            </div>
            <div className="text-2xl font-bold font-mono text-foreground">
              {stats?.totalReferrals || 0}
            </div>
          </div>
          
          <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Gift className="h-3 w-3" />
              Créditos Ganhos
            </div>
            <div className="text-2xl font-bold font-mono text-neon-cyan">
              {stats?.totalCreditsEarned || 0}
            </div>
          </div>
        </div>

        {/* Referral Code */}
        {stats?.referralCode && (
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Seu código de indicação</label>
            <div className="flex gap-2">
              <div className="flex-1 px-3 py-2 rounded-lg bg-muted/50 border border-border/50 font-mono text-sm text-foreground">
                {stats.referralCode}
              </div>
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleCopy}
                className="shrink-0"
              >
                {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Ganhe 100 créditos para cada amigo que se cadastrar usando seu código!
            </p>
          </div>
        )}

        {/* Apply Code */}
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Tem um código de indicação?</label>
          <div className="flex gap-2">
            <Input
              value={referralInput}
              onChange={(e) => setReferralInput(e.target.value.toUpperCase())}
              placeholder="XPEX12345678"
              className="font-mono"
            />
            <Button onClick={handleApplyCode} disabled={!referralInput.trim()}>
              Aplicar
            </Button>
          </div>
        </div>

        {/* Recent Referrals */}
        {referrals.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Indicações recentes</span>
              <TrendingUp className="h-4 w-4 text-neon-cyan" />
            </div>
            <div className="space-y-2">
              {referrals.slice(0, 3).map((referral) => (
                <div 
                  key={referral.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/20 border border-border/30"
                >
                  <span className="text-xs font-mono text-muted-foreground">
                    {new Date(referral.created_at).toLocaleDateString('pt-BR')}
                  </span>
                  <Badge 
                    variant={referral.status === 'rewarded' ? 'default' : 'secondary'}
                    className={referral.status === 'rewarded' ? 'bg-green-500/20 text-green-400' : ''}
                  >
                    {referral.status === 'rewarded' ? `+${referral.reward_credits}` : referral.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
