import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET: Retrieve all inventory items
export async function GET() {
    const { data, error } = await supabase
        .from('inventory')
        .select('*');

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}

// POST: Add a new inventory item
export async function POST(request: Request) {
    const { name, quantity } = await request.json();

    const { data, error } = await supabase
        .from('inventory')
        .insert([{ name, quantity }]);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
}

// PUT: Update an existing inventory item
export async function PUT(request: Request) {
    const { id, name, quantity } = await request.json();

    const { data, error } = await supabase
        .from('inventory')
        .update({ name, quantity })
        .eq('id', id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}

// DELETE: Remove an inventory item
export async function DELETE(request: Request) {
    const { id } = await request.json();

    const { data, error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}