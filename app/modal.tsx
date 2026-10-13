'use client';
import { useEffect,useRef } from 'react';
import { X } from 'lucide-react';
export default function Modal({title,children,onClose,wide=false}:{title:string;children:React.ReactNode;onClose:()=>void;wide?:boolean}) {
  const ref=useRef<HTMLDialogElement>(null);
  useEffect(()=>{const el=ref.current;el?.showModal();return()=>{el?.close();};},[]);
  return <dialog ref={ref} className={'modal '+(wide?'wide':'')} onCancel={e=>{e.preventDefault();onClose();}} onClick={e=>{if(e.target===ref.current)onClose();}} aria-labelledby="modal-title">
    <div className="modal-inner"><div className="modal-heading"><h2 id="modal-title">{title}</h2><button type="button" className="icon-button" aria-label="Close dialog" onClick={onClose}><X size={20}/></button></div>{children}</div>
  </dialog>;
}
