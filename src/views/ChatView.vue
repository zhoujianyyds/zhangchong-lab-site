<script setup>
import { Bot, ExternalLink, MessageSquareText, ShieldCheck } from 'lucide-vue-next'
import AuthGate from '../components/AuthGate.vue'
</script>

<template>
  <AuthGate tool-id="chat" title="ChatGPT 车队" subtitle="从组内入口打开 AI 辅助工具，正式版可接入已有服务或 OpenAI API。">
    <section class="chat-panel">
      <div>
        <Bot :size="42" />
        <h2>组内 AI 工具入口</h2>
        <p>
          当前页面是入口壳：可以连接 ChatGPT、文献知识库、代码助手或实验记录助手。真实上线时，建议由后端生成临时访问链接或代理 API。
        </p>
      </div>
      <div class="tool-grid compact-tools">
        <article class="tool-card">
          <MessageSquareText :size="26" />
          <h3>文献阅读</h3>
          <p>辅助摘要论文、抽取方法和实验设置。</p>
        </article>
        <article class="tool-card">
          <ShieldCheck :size="26" />
          <h3>权限隔离</h3>
          <p>按成员身份控制是否显示和访问。</p>
        </article>
      </div>
      <a class="button button-dark" href="https://chat.openai.com/" target="_blank" rel="noreferrer">
        打开 ChatGPT
        <ExternalLink :size="17" />
      </a>
    </section>
  </AuthGate>
</template>
