'use client';

import { useRef, useEffect } from 'react';

interface DagNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  update(): void;
  draw(ctx: CanvasRenderingContext2D): void;
}

export default function TechnologySection() {
  const dagCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = dagCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.clientWidth;
    let height = canvas.clientHeight;
    canvas.width = width;
    canvas.height = height;

    const nodes: DagNode[] = [];
    const edges: { from: DagNode; to: DagNode }[] = [];

    class DagNodeImpl implements DagNode {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      alpha: number;

      constructor() {
        this.x = width - 20;
        this.y = Math.random() * height;
        this.vx = -(Math.random() * 0.3 + 0.2);
        this.vy = (Math.random() - 0.5) * 0.2;
        this.radius = 5;
        this.alpha = 0;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.y < 20 || this.y > height - 20) this.vy *= -1;
        if (this.alpha < 1) this.alpha += 0.05;
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(34, 197, 94, ${this.alpha})`;
        ctx.fill();
      }
    }

    function addNode() {
      if (nodes.length > 60) return;
      const newNode = new DagNodeImpl();
      if (nodes.length > 1) {
        const targets = nodes
          .filter(n => n.x > newNode.x - 300)
          .sort(() => 0.5 - Math.random())
          .slice(0, 2);
        targets.forEach(target => edges.push({ from: newNode, to: target }));
      }
      nodes.push(newNode);
    }

    let lastTime = 0;
    const intervalToAddNode = 400;

    function animate(currentTime: number) {
      if (currentTime - lastTime > intervalToAddNode) {
        addNode();
        lastTime = currentTime;
      }

      ctx!.clearRect(0, 0, width, height);

      edges.forEach(edge => {
        ctx!.beginPath();
        ctx!.moveTo(edge.from.x, edge.from.y);
        ctx!.lineTo(edge.to.x, edge.to.y);
        ctx!.strokeStyle = `rgba(34, 197, 94, ${Math.min(edge.from.alpha, edge.to.alpha) * 0.3})`;
        ctx!.lineWidth = 1;
        ctx!.stroke();
      });

      nodes.forEach(node => {
        node.update();
        node.draw(ctx!);
      });

      // Remove old nodes and their associated edges, with undefined check on edges[i]
      nodes.filter(node => node.x < -50).forEach(node => {
        const nodeIndex = nodes.indexOf(node);
        if (nodeIndex !== -1) nodes.splice(nodeIndex, 1);
        for (let i = edges.length - 1; i >= 0; i--) {
          const edge = edges[i];
          if (edge && (edge.from === node || edge.to === node)) {
            edges.splice(i, 1);
          }
        }
      });

      requestAnimationFrame(animate);
    }

    const handleResize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener('resize', handleResize);
    requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <section id="technology" className="dark-section content-section">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="text-center lg:text-left">
            <h2 className="section-title mb-8">The Power of the DAG</h2>
            <p className="section-subtitle text-gray-400 mb-8">
              Unlike slow, linear blockchains that process transactions one-by-one, our Directed Acyclic Graph (DAG) 
              architecture processes them in parallel. This creates a faster, more scalable, and hyper-efficient network that flows, not stacks.
            </p>
          </div>
          <div className="w-full aspect-video lg:aspect-square bg-black/20 rounded-lg p-2 shadow-2xl">
            <canvas ref={dagCanvasRef} className="w-full h-full" />
          </div>
        </div>
        
        <div className="mt-24">
          <h3 className="section-title text-center mb-12">Chain Configuration</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="spec-card p-6 rounded-xl text-center">
              <h4 className="text-lg font-bold text-green-400">Consensus</h4>
              <p className="text-2xl font-semibold mt-2">Hybrid Consensus</p>
              <p className="text-gray-400 text-sm mt-1">DAG Ordering + PoW Finality</p>
            </div>
            <div className="spec-card p-6 rounded-xl text-center">
              <h4 className="text-lg font-bold text-green-400">Block Rate</h4>
              <p className="text-2xl font-semibold mt-2">10 blocks/sec</p>
              <p className="text-gray-400 text-sm mt-1">Near-instant confirmations</p>
            </div>
            <div className="spec-card p-6 rounded-xl text-center">
              <h4 className="text-lg font-bold text-green-400">Hashing Algorithm</h4>
              <p className="text-2xl font-semibold mt-2">SHA-3 (Keccak-256)</p>
              <p className="text-gray-400 text-sm mt-1">EVM-standard security</p>
            </div>
            <div className="spec-card p-6 rounded-xl text-center">
              <h4 className="text-lg font-bold text-green-400">Smart Contracts</h4>
              <p className="text-2xl font-semibold mt-2">Solidity (.sol)</p>
              <p className="text-gray-400 text-sm mt-1">EVM Compatible Runtime</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
