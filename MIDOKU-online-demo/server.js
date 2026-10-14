
import express from "express";
import http from "http";
import { Server } from "socket.io";

const app=express(), server=http.createServer(app), io=new Server(server);
app.use(express.static("public"));
const rooms=new Map();

const chapters=[
 {title:"储物柜里的蛋", public:"放学后，你们在旧体育仓库发现一颗正在发热的黑色蛋。屏幕显示：距离孵化 02:14:37。",
  p1:"扫描结果：该生物可能具有攻击性。不要让它接触其他学生。",p2:"扫描结果：没有检测到攻击性。它似乎正在寻找可以信任的人。",
  a1:["立刻告诉老师","先把蛋藏起来"],a2:["先把蛋藏起来","交给老师处理"]},
 {title:"孵化", public:"第二天，蛋已经裂开。里面的小生物睁开眼睛，并开始模仿你们说话。",
  p1:"它第一次模仿的是玩家2昨晚说过的一句话。",p2:"系统提示：玩家1曾在你不在场时接触过它。",
  a1:["继续照顾它","把它转移出去"],a2:["让它继续留下","要求立刻转移"]},
 {title:"不一致的记录", public:"学校监控显示昨晚有人进入仓库。但画面只剩下模糊的人影。",
  p1:"系统记录：玩家2在23:14进入过仓库。",p2:"你的定位记录显示：昨晚23:14你一直在家。",
  a1:["相信系统记录","相信玩家2的解释"],a2:["公开自己的定位记录","暂时隐瞒记录"]},
 {title:"只有一人收到的消息", public:"午休时，公共屏幕突然黑了一秒，然后恢复正常。",
  p1:"你没有收到额外信息。",p2:"【私人消息】不要告诉玩家1：它真正害怕的不是老师，而是玩家1。",
  a1:["继续原计划","要求交换彼此看到的信息"],a2:["把消息告诉玩家1","按照消息保持沉默"]},
 {title:"谁改变了选择", public:"系统宣布：昨晚有人改变了决定，但拒绝显示是谁。",
  p1:"系统私下告诉你：『玩家2改变过选择。』",p2:"系统记录显示：你没有改变任何选择。",
  a1:["直接质问玩家2","先观察，不揭穿系统"],a2:["主动说明自己没改","等待玩家1先开口"]},
 {title:"第二个出口", public:"小生物带你们来到学校地下。这里出现两扇从未见过的门。",
  p1:"左门上写着：只有一个人可以安全通过。",p2:"右门上写着：两个人一起进入才会打开。",
  a1:["选择左门","选择右门"],a2:["选择右门","选择左门"]},
 {title:"被删除的十分钟", public:"你们同时发现，手机记录中有十分钟完全空白。",
  p1:"你的相册里多出一张玩家2站在控制台前的照片。",p2:"你的相册里多出一张玩家1站在控制台前的照片。",
  a1:["立刻展示照片","先问对方记不记得"],a2:["展示照片","先隐藏照片"]},
 {title:"系统的条件", public:"系统提出交易：只要其中一人退出，另一人就能看到全部真相。",
  p1:"附加提示：玩家2已经同意退出。（真实性未知）",p2:"附加提示：玩家1尚未作出决定。（真实性未知）",
  a1:["接受交易","拒绝交易"],a2:["拒绝交易","接受交易"]},
 {title:"它开始说话", public:"小生物第一次用自己的声音说：『你们为什么一直相信屏幕？』",
  p1:"它告诉你：系统从第三章开始就在修改信息。",p2:"它告诉你：系统从第一章开始就在测试你们。",
  a1:["相信它","仍然相信系统"],a2:["相信小生物","要求系统证明自己"]},
 {title:"最后一次选择", public:"出口已经打开。系统要求你们分别做出最后决定。屏幕上没有显示任何规则。",
  p1:"最后一条私人信息：『如果你们选择不同，只有你能离开。』",p2:"最后一条私人信息：『如果你们选择相同，两个人都能离开。』",
  a1:["和对方商量后决定","不透露信息，独自决定"],a2:["把信息全部告诉对方","保留最后的秘密"]}
];

function state(room){
 return {chapter:0,phase:"first",players:{},history:[],created:Date.now()};
}
io.on("connection",socket=>{
 socket.on("join",({room,player})=>{
   room=(room||"MIDOKU").toUpperCase().slice(0,12); player=player==="2"?"2":"1";
   if(!rooms.has(room)) rooms.set(room,state(room));
   const r=rooms.get(room); r.players[player]={...(r.players[player]||{}),id:socket.id,changes:r.players[player]?.changes??3};
   socket.data={room,player}; socket.join(room); emit(room);
 });
 socket.on("choose",choice=>{
   const {room,player}=socket.data||{}; if(!room)return; const r=rooms.get(room); if(!r)return;
   r.players[player].choice=choice; check(r,room);
 });
 socket.on("final",({choice,changed})=>{
   const {room,player}=socket.data||{}; const r=rooms.get(room); if(!r)return;
   if(changed && r.players[player].changes>0) r.players[player].changes--;
   r.players[player].final=choice; checkFinal(r,room);
 });
 socket.on("next",()=>{
   const {room}=socket.data||{}; const r=rooms.get(room); if(!r)return;
   r.chapter++; r.phase="first";
   for(const p of Object.values(r.players)){delete p.choice;delete p.final;}
   emit(room);
 });
});
function check(r,room){
 if(r.players["1"]?.choice && r.players["2"]?.choice){r.phase="discuss"; emit(room)} else emit(room);
}
function checkFinal(r,room){
 if(r.players["1"]?.final && r.players["2"]?.final){
   r.phase="result"; r.history.push({chapter:r.chapter,p1:r.players["1"].final,p2:r.players["2"].final}); emit(room);
 } else emit(room);
}
function emit(room){
 const r=rooms.get(room), ch=chapters[r.chapter];
 for(const p of ["1","2"]){
   const pl=r.players[p]; if(!pl?.id)continue;
   io.to(pl.id).emit("state",{
    room,player:p,chapter:r.chapter,phase:r.phase,connected:Object.keys(r.players).length,
    title:ch?.title,public:ch?.public,private:p==="1"?ch?.p1:ch?.p2,
    options:p==="1"?ch?.a1:ch?.a2,changes:pl.changes,
    myChoice:pl.choice,otherReady:!!r.players[p==="1"?"2":"1"]?.choice,
    myFinal:pl.final,otherFinalReady:!!r.players[p==="1"?"2":"1"]?.final,
    result:r.phase==="result"?resultText(r):null,finished:r.chapter>=9 && r.phase==="result"
   });
 }
}
function resultText(r){
 const a=r.players["1"].final,b=r.players["2"].final;
 if(r.chapter===9) return a===b?"你们作出了相同的决定。出口同时为两个人打开。系统最后一次闪烁，然后彻底离线。":"你们作出了不同的决定。出口没有立刻关闭——系统似乎在等待你们重新理解刚才收到的信息。";
 return a===b?"你们最终作出了相同方向的决定。故事因此沿着共同路线继续。":"你们最终没有达成一致。下一章中，系统会利用这道裂缝继续改变信息。";
}
server.listen(process.env.PORT||3000,()=>console.log("MIDOKU running"));
