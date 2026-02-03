import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { partnerMemory, isDbUnavailable, markMemoryFallback, shouldUseMemory } from '@/app/api/partner/_memory';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function DELETE(_request: NextRequest, context: { params: { id: string } }) {
  try {
    const { id } = context.params;
    if (shouldUseMemory()) {
      partnerMemory.deleteAsset(id);
    } else {
      try {
        await prisma.partnerAsset.delete({ where: { id } });
      } catch (error) {
        if (isDbUnavailable(error)) {
          markMemoryFallback();
          partnerMemory.deleteAsset(id);
        } else {
          throw error;
        }
      }
    }
    return NextResponse.json(
      { ok: true },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Delete asset error:', error);
    return NextResponse.json(
      { error: '删除 asset 失败' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}
