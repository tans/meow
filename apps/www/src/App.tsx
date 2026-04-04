import { useEffect, useState } from "react";
import { Sparkles, CheckCircle, ArrowRight, Users, Target, Shield, Zap, Star, Play, Quote } from "lucide-react";

// Navigation Component
function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? "bg-white/95 backdrop-blur-xl shadow-sm" : "bg-transparent"
    }`}>
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex items-center justify-between h-[72px]">
          {/* Logo */}
          <a href="#" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#4f8ef7] to-[#6366f1] rounded-xl flex items-center justify-center text-white font-bold text-lg">
              喵
            </div>
            <span className="font-bold text-xl text-[#1a1a2e]">创意喵</span>
          </a>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-10">
            <a href="#features" className="text-[#6b7280] font-medium hover:text-[#4f8ef7] transition-colors">功能</a>
            <a href="#value" className="text-[#6b7280] font-medium hover:text-[#4f8ef7] transition-colors">产品</a>
            <a href="#testimonials" className="text-[#6b7280] font-medium hover:text-[#4f8ef7] transition-colors">案例</a>
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center gap-4">
            <a 
              href="http://localhost:3000" 
              className="hidden sm:flex items-center gap-2 text-[#6b7280] font-medium hover:text-[#4f8ef7] transition-colors"
            >
              商家后台
            </a>
            <a 
              href="http://localhost:5173" 
              className="flex items-center gap-2 bg-[#4f8ef7] text-white px-6 py-2.5 rounded-full font-semibold hover:bg-[#2b7de9] transition-all hover:-translate-y-0.5 shadow-lg shadow-[#4f8ef7]/25"
            >
              进入工作台
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}

// Phone Mockup Component
function PhoneMockup() {
  return (
    <div className="relative w-[280px] h-[560px] bg-[#1a1a2e] rounded-[40px] p-3 shadow-2xl shadow-black/30">
      <div className="w-full h-full bg-[#1a1a2e] rounded-[32px] overflow-hidden relative">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-6 bg-[#1a1a2e] rounded-b-2xl z-10" />
        
        {/* Status Bar */}
        <div className="flex justify-between px-4 py-2 text-[10px] text-white/60">
          <span>9:41</span>
          <span>5G</span>
        </div>

        {/* App Content */}
        <div className="px-3 pt-2">
          {/* Header Card */}
          <div className="bg-gradient-to-br from-[#4f8ef7] to-[#6366f1] rounded-xl p-4 text-white mb-3">
            <div className="text-base font-bold mb-1">创意喵</div>
            <div className="text-xs opacity-80">AI内容众包平台</div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl p-3 mb-3">
            <div className="text-xs font-semibold text-[#1a1a2e] mb-2">快捷功能</div>
            <div className="grid grid-cols-4 gap-2">
              {["📷", "🎬", "✍️", "🎨"].map((icon, i) => (
                <div key={i} className="text-center p-2 bg-[#f3f4f6] rounded-lg">
                  <div className="text-lg mb-1">{icon}</div>
                  <div className="text-[8px] text-[#6b7280]">功能{i + 1}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Task List */}
          <div className="bg-white rounded-xl p-3">
            <div className="text-xs font-semibold text-[#1a1a2e] mb-2">热门任务</div>
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center gap-2 p-2 bg-[#f3f4f6] rounded-lg mb-2">
                <div className="w-10 h-10 bg-[#e8f2ff] rounded-lg flex items-center justify-center text-lg">
                  📱
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-[#1a1a2e] truncate">短视频创作</div>
                  <div className="text-[10px] text-[#9ca3af]">剩余3天</div>
                </div>
                <div className="text-xs font-bold text-[#ff6b35]">¥500</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Nav */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-around py-3 bg-white border-t border-[#f3f4f6]">
          {["首页", "任务", "消息", "我的"].map((item, i) => (
            <div key={i} className={`text-center ${i === 0 ? "text-[#4f8ef7]" : "text-[#9ca3af]"}`}>
              <div className="text-base mb-0.5">{["🏠", "📋", "💬", "👤"][i]}</div>
              <div className="text-[9px]">{item}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Hero Section
function Hero() {
  return (
    <section className="pt-[160px] pb-24 bg-gradient-to-b from-white to-[#f8fafc] relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute -top-1/2 -right-20 w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(79,142,247,0.08)_0%,transparent_70%)] rounded-full" />
      <div className="absolute -bottom-1/3 -left-10 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(99,102,241,0.06)_0%,transparent_70%)] rounded-full" />

      <div className="max-w-[1200px] mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div className="animate-[fadeInUp_0.8s_ease]">
            <div className="inline-flex items-center gap-2 bg-[#e8f2ff] text-[#4f8ef7] px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <Sparkles className="w-4 h-4" />
              新一代AI内容众包平台
            </div>
            
            <h1 className="text-4xl lg:text-5xl font-extrabold text-[#1a1a2e] leading-tight mb-6">
              连接<span className="bg-gradient-to-r from-[#4f8ef7] to-[#6366f1] bg-clip-text text-transparent">10万+创作者</span>
              <br />为企业提供AI内容服务
            </h1>
            
            <p className="text-lg text-[#6b7280] leading-relaxed mb-8 max-w-lg">
              创意喵是新一代AI内容众包撮合平台，汇聚10万+优质创作者，为企业提供短视频、图片等AI内容一站式服务。
            </p>

            <div className="flex flex-wrap gap-4 mb-12">
              <a 
                href="http://localhost:5173"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-[#4f8ef7] to-[#6366f1] text-white px-8 py-4 rounded-full font-semibold hover:shadow-xl hover:shadow-[#4f8ef7]/30 transition-all hover:-translate-y-1"
              >
                进入工作台
                <ArrowRight className="w-5 h-5" />
              </a>
              <button className="inline-flex items-center gap-2 bg-white text-[#1a1a2e] border-2 border-[#f3f4f6] px-8 py-4 rounded-full font-semibold hover:border-[#4f8ef7] hover:text-[#4f8ef7] transition-all">
                <Play className="w-5 h-5" />
                观看演示
              </button>
            </div>
          </div>

          {/* Phone Visual */}
          <div className="flex justify-center lg:justify-end animate-[fadeInUp_0.8s_ease_0.2s_both]">
            <PhoneMockup />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-16 mt-16 border-t border-[#f3f4f6]">
          {[
            { value: "10万+", label: "注册创作者" },
            { value: "5000+", label: "企业客户" },
            { value: "50万+", label: "完成任务" },
            { value: "98%", label: "好评率" },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-[#4f8ef7] to-[#6366f1] bg-clip-text text-transparent">
                {stat.value}
              </div>
              <div className="text-[#6b7280] mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Value Props Section
function ValueProps() {
  return (
    <section id="value" className="py-24 bg-white">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-16">
          <span className="inline-block text-[#4f8ef7] font-semibold mb-4">产品价值</span>
          <h2 className="text-3xl lg:text-4xl font-bold text-[#1a1a2e] mb-4">
            为什么选择创意喵
          </h2>
          <p className="text-[#6b7280] max-w-2xl mx-auto">
            我们为企业与创作者搭建高效、安全、智能的内容众包平台
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: <Zap className="w-8 h-8" />,
              title: "高效率",
              desc: "AI智能匹配创作者，平均任务完成时间缩短60%，让企业快速获得优质内容",
              color: "from-[#4f8ef7] to-[#6366f1]",
            },
            {
              icon: <Target className="w-8 h-8" />,
              title: "低成本",
              desc: "去中介化的众包模式，企业成本降低40%，创作者收益提升30%",
              color: "from-[#ff6b35] to-[#ff8f5a]",
            },
            {
              icon: <Shield className="w-8 h-8" />,
              title: "强保障",
              desc: "资金托管、版权保护、质量审核三重保障，让交易安全无忧",
              color: "from-[#34c759] to-[#30d158]",
            },
          ].map((item, i) => (
            <div key={i} className="group p-8 bg-[#f8fafc] rounded-2xl hover:bg-white hover:shadow-xl transition-all duration-300">
              <div className={`w-16 h-16 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform`}>
                {item.icon}
              </div>
              <h3 className="text-xl font-bold text-[#1a1a2e] mb-3">{item.title}</h3>
              <p className="text-[#6b7280] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Features Section
function Features() {
  return (
    <section id="features" className="py-24 bg-[#f8fafc]">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-16">
          <span className="inline-block text-[#4f8ef7] font-semibold mb-4">功能特点</span>
          <h2 className="text-3xl lg:text-4xl font-bold text-[#1a1a2e] mb-4">
            一站式AI内容服务
          </h2>
          <p className="text-[#6b7280] max-w-2xl mx-auto">
            从任务发布到交付验收，全流程智能化管理
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: "📝", title: "智能任务发布", desc: "AI辅助生成任务描述，智能定价建议" },
            { icon: "🤖", title: "AI创作者匹配", desc: "基于内容类型自动匹配最适合的创作者" },
            { icon: "💰", title: "资金托管", desc: "第三方资金托管，验收通过才放款" },
            { icon: "📊", title: "数据分析", desc: "内容效果追踪，ROI智能分析" },
            { icon: "🔒", title: "版权保护", desc: "区块链存证，原创内容确权" },
            { icon: "✅", title: "质量审核", desc: "AI初筛+人工复核，确保交付质量" },
            { icon: "⚡", title: "快速交付", desc: "标准任务48小时内交付" },
            { icon: "🎯", title: "专属客服", desc: "企业客户专属服务团队" },
          ].map((feature, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl hover:shadow-lg transition-shadow">
              <div className="text-3xl mb-4">{feature.icon}</div>
              <h3 className="font-bold text-[#1a1a2e] mb-2">{feature.title}</h3>
              <p className="text-sm text-[#6b7280]">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Testimonials Section
function Testimonials() {
  return (
    <section id="testimonials" className="py-24 bg-white">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-16">
          <span className="inline-block text-[#4f8ef7] font-semibold mb-4">用户证言</span>
          <h2 className="text-3xl lg:text-4xl font-bold text-[#1a1a2e] mb-4">
            他们都在用创意喵
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              quote: "创意帮我们把短视频内容生产效率提升了3倍，而且质量非常稳定。",
              author: "张经理",
              role: "某电商平台运营总监",
              rating: 5,
            },
            {
              quote: "作为创作者，创意喵让我找到了稳定的收入来源，平台保护创作者权益做得非常好。",
              author: "小李",
              role: "短视频创作者",
              rating: 5,
            },
            {
              quote: "资金托管让我们很放心，合作过的创作者都很专业，交付准时。",
              author: "王总",
              role: "品牌市场部负责人",
              rating: 5,
            },
          ].map((item, i) => (
            <div key={i} className="bg-[#f8fafc] p-8 rounded-2xl">
              <div className="flex gap-1 mb-4">
                {Array.from({ length: item.rating }).map((_, j) => (
                  <Star key={j} className="w-5 h-5 fill-[#ff6b35] text-[#ff6b35]" />
                ))}
              </div>
              <Quote className="w-8 h-8 text-[#4f8ef7]/20 mb-4" />
              <p className="text-[#1a1a2e] mb-6 leading-relaxed">{item.quote}</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#4f8ef7] to-[#6366f1] rounded-full flex items-center justify-center text-white font-bold">
                  {item.author[0]}
                </div>
                <div>
                  <div className="font-semibold text-[#1a1a2e]">{item.author}</div>
                  <div className="text-sm text-[#6b7280]">{item.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// CTA Section
function CTA() {
  return (
    <section className="py-24 bg-gradient-to-br from-[#1a1a2e] to-[#2d2d44] text-white">
      <div className="max-w-[1200px] mx-auto px-6 text-center">
        <h2 className="text-3xl lg:text-4xl font-bold mb-6">
          准备好开始了吗？
        </h2>
        <p className="text-white/70 text-lg mb-10 max-w-2xl mx-auto">
          无论您是寻找优质创作者的企业，还是希望接单变现的创作者，创意喵都是您的最佳选择
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <a 
            href="http://localhost:5173"
            className="inline-flex items-center gap-2 bg-white text-[#1a1a2e] px-8 py-4 rounded-full font-semibold hover:shadow-xl transition-all"
          >
            <Users className="w-5 h-5" />
            我是创作者
          </a>
          <a 
            href="http://localhost:3000"
            className="inline-flex items-center gap-2 bg-[#ff6b35] text-white px-8 py-4 rounded-full font-semibold hover:shadow-xl hover:shadow-[#ff6b35]/30 transition-all"
          >
            <Target className="w-5 h-5" />
            我是商家/运营
          </a>
        </div>
      </div>
    </section>
  );
}

// Footer
function Footer() {
  return (
    <footer className="py-16 bg-white border-t border-[#f3f4f6]">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-[#4f8ef7] to-[#6366f1] rounded-xl flex items-center justify-center text-white font-bold">
                喵
              </div>
              <span className="font-bold text-xl text-[#1a1a2e]">创意喵</span>
            </div>
            <p className="text-[#6b7280] max-w-sm">
              新一代AI内容众包撮合平台，连接创作者与企业，提供高效、安全的内容服务
            </p>
          </div>
          <div>
            <h4 className="font-bold text-[#1a1a2e] mb-4">产品</h4>
            <ul className="space-y-2 text-[#6b7280]">
              <li><a href="#features" className="hover:text-[#4f8ef7]">功能介绍</a></li>
              <li><a href="#" className="hover:text-[#4f8ef7]">定价方案</a></li>
              <li><a href="#" className="hover:text-[#4f8ef7]">API文档</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-[#1a1a2e] mb-4">入口</h4>
            <ul className="space-y-2 text-[#6b7280]">
              <li><a href="http://localhost:5173" className="hover:text-[#4f8ef7]">创作者工作台</a></li>
              <li><a href="http://localhost:3000" className="hover:text-[#4f8ef7]">商家后台</a></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-[#f3f4f6] text-center text-[#6b7280] text-sm">
          © 2026 创意喵. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

// Main App
export default function App() {
  return (
    <div className="min-h-screen">
      <Nav />
      <Hero />
      <ValueProps />
      <Features />
      <Testimonials />
      <CTA />
      <Footer />
    </div>
  );
}
