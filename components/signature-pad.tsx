"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export function SignaturePad() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const [value, setValue] = useState("");
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = "#12333d";
    context.lineWidth = 2.8;
    context.lineCap = "round";
    context.lineJoin = "round";
  }, []);
  const point = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * event.currentTarget.width / rect.width, y: (event.clientY - rect.top) * event.currentTarget.height / rect.height };
  };
  const start = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    drawingRef.current = true;
    const p = point(event);
    const context = event.currentTarget.getContext("2d");
    context?.beginPath(); context?.moveTo(p.x, p.y); context?.lineTo(p.x + 0.1, p.y + 0.1); context?.stroke();
  };
  const move = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const p = point(event);
    const context = event.currentTarget.getContext("2d");
    context?.lineTo(p.x, p.y); context?.stroke();
  };
  const end = () => {
    drawingRef.current = false;
    setValue(canvasRef.current?.toDataURL("image/png") ?? "");
  };
  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    canvas.getContext("2d")?.fillRect(0, 0, canvas.width, canvas.height);
    setValue("");
  };
  return <div><div className="overflow-hidden rounded-xl border border-[#c8dada] bg-white"><canvas ref={canvasRef} width={600} height={180} className="block h-[180px] w-full touch-none" aria-label="Espacio para firmar" onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={end} /></div><input type="hidden" name="signatureDataUrl" value={value} /><Button type="button" variant="outline" size="sm" className="mt-2" onClick={clear}>Borrar firma</Button></div>;
}
