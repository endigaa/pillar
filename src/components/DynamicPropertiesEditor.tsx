import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Trash2 } from 'lucide-react';
import type { CustomProperty } from '@shared/types';
import { Label } from '@/components/ui/label';
interface DynamicPropertiesEditorProps {
  properties: CustomProperty[];
  onChange: (properties: CustomProperty[]) => void;
}
export function DynamicPropertiesEditor({ properties, onChange }: DynamicPropertiesEditorProps) {
  const handleAddProperty = () => {
    onChange([...properties, { name: '', value: '', type: 'text' }]);
  };
  const handleRemoveProperty = (index: number) => {
    const newProperties = [...properties];
    newProperties.splice(index, 1);
    onChange(newProperties);
  };
  const handlePropertyChange = (index: number, field: keyof CustomProperty, value: string) => {
    const newProperties = [...properties];
    newProperties[index] = { ...newProperties[index], [field]: value };
    onChange(newProperties);
  };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Custom Properties</Label>
        <Button type="button" variant="outline" size="sm" onClick={handleAddProperty}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Property
        </Button>
      </div>
      {properties.length === 0 && (
        <p className="text-sm text-muted-foreground italic">No custom properties added.</p>
      )}
      {properties.map((prop, index) => (
        <div key={index} className="flex items-start gap-2">
          <div className="flex-1">
            <Input
              placeholder="Name (e.g. Warranty Date)"
              value={prop.name}
              onChange={(e) => handlePropertyChange(index, 'name', e.target.value)}
              className="h-8"
            />
          </div>
          <div className="w-24">
            <Select
              value={prop.type}
              onValueChange={(value) => handlePropertyChange(index, 'type', value as 'text' | 'date' | 'number')}
            >
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="number">Number</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Input
              type={prop.type === 'date' ? 'date' : prop.type === 'number' ? 'number' : 'text'}
              placeholder="Value"
              value={prop.value}
              onChange={(e) => handlePropertyChange(index, 'value', e.target.value)}
              className="h-8"
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive"
            onClick={() => handleRemoveProperty(index)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}