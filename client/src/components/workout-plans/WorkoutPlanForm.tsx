import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const exerciseSchema = z.object({
  name: z.string().min(1, 'Exercise name is required'),
  sets: z.number().min(1, 'Sets must be at least 1'),
  reps: z.number().min(1, 'Reps must be at least 1'),
  restTime: z.number().min(0, 'Rest time must be at least 0'),
  notes: z.string().optional(),
});

const daySchema = z.object({
  dayNumber: z.number(),
  exercises: z.array(exerciseSchema),
});

const weekSchema = z.object({
  weekNumber: z.number(),
  days: z.array(daySchema),
});

const formSchema = z.object({
  name: z.string().min(1, 'Plan name is required'),
  goal: z.string().min(1, 'Goal is required'),
  duration: z.number().min(1, 'Duration must be at least 1 week'),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  weeks: z.array(weekSchema),
});

type FormData = z.infer<typeof formSchema>;

interface WorkoutPlanFormProps {
  onSubmit: (data: FormData) => Promise<void>;
  initialData?: FormData;
}

const WorkoutPlanForm: React.FC<WorkoutPlanFormProps> = ({
  onSubmit,
  initialData,
}) => {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      name: '',
      goal: '',
      duration: 4,
      level: 'beginner',
      weeks: [],
    },
  });

  const handleSubmit = async (values: FormData) => {
    try {
      await onSubmit(values);
      toast.success('Workout plan saved successfully');
    } catch (error) {
      toast.error('Failed to save workout plan');
    }
  };

  const addWeek = () => {
    const currentWeeks = form.getValues('weeks');
    const newWeekNumber = currentWeeks.length + 1;
    
    form.setValue('weeks', [
      ...currentWeeks,
      {
        weekNumber: newWeekNumber,
        days: [
          {
            dayNumber: 1,
            exercises: [],
          },
        ],
      },
    ]);
  };

  const addDay = (weekIndex: number) => {
    const weeks = form.getValues('weeks');
    const currentDays = weeks[weekIndex].days;
    const newDayNumber = currentDays.length + 1;

    weeks[weekIndex].days.push({
      dayNumber: newDayNumber,
      exercises: [],
    });

    form.setValue('weeks', weeks);
  };

  const addExercise = (weekIndex: number, dayIndex: number) => {
    const weeks = form.getValues('weeks');
    weeks[weekIndex].days[dayIndex].exercises.push({
      name: '',
      sets: 3,
      reps: 10,
      restTime: 60,
      notes: '',
    });

    form.setValue('weeks', weeks);
  };

  const removeExercise = (weekIndex: number, dayIndex: number, exerciseIndex: number) => {
    const weeks = form.getValues('weeks');
    weeks[weekIndex].days[dayIndex].exercises.splice(exerciseIndex, 1);
    form.setValue('weeks', weeks);
  };

  const removeWeek = (weekIndex: number) => {
    const weeks = form.getValues('weeks');
    weeks.splice(weekIndex, 1);
    // Update week numbers
    weeks.forEach((week, index) => {
      week.weekNumber = index + 1;
    });
    form.setValue('weeks', weeks);
  };

  const removeDay = (weekIndex: number, dayIndex: number) => {
    const weeks = form.getValues('weeks');
    weeks[weekIndex].days.splice(dayIndex, 1);
    // Update day numbers
    weeks[weekIndex].days.forEach((day, index) => {
      day.dayNumber = index + 1;
    });
    form.setValue('weeks', weeks);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plan Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter plan name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="goal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Goal</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select goal" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="weight_loss">Weight Loss</SelectItem>
                      <SelectItem value="muscle_gain">Muscle Gain</SelectItem>
                      <SelectItem value="endurance">Endurance</SelectItem>
                      <SelectItem value="flexibility">Flexibility</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (weeks)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        min={1}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Level</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Weekly Breakdown</CardTitle>
            <Button type="button" onClick={addWeek}>
              <Plus className="h-4 w-4 mr-2" />
              Add Week
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {form.watch('weeks').map((week, weekIndex) => (
              <Card key={weekIndex}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Week {week.weekNumber}</CardTitle>
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => addDay(weekIndex)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Day
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => removeWeek(weekIndex)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {week.days.map((day, dayIndex) => (
                    <Card key={dayIndex}>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Day {day.dayNumber}</CardTitle>
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={() => removeDay(weekIndex, dayIndex)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {day.exercises.map((exercise, exerciseIndex) => (
                          <div
                            key={exerciseIndex}
                            className="grid grid-cols-5 gap-4 items-end"
                          >
                            <FormField
                              control={form.control}
                              name={`weeks.${weekIndex}.days.${dayIndex}.exercises.${exerciseIndex}.name`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Exercise</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="Exercise name" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`weeks.${weekIndex}.days.${dayIndex}.exercises.${exerciseIndex}.sets`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Sets</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      {...field}
                                      onChange={(e) =>
                                        field.onChange(Number(e.target.value))
                                      }
                                      min={1}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`weeks.${weekIndex}.days.${dayIndex}.exercises.${exerciseIndex}.reps`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Reps</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      {...field}
                                      onChange={(e) =>
                                        field.onChange(Number(e.target.value))
                                      }
                                      min={1}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`weeks.${weekIndex}.days.${dayIndex}.exercises.${exerciseIndex}.restTime`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Rest (sec)</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      {...field}
                                      onChange={(e) =>
                                        field.onChange(Number(e.target.value))
                                      }
                                      min={0}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                removeExercise(weekIndex, dayIndex, exerciseIndex)
                              }
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => addExercise(weekIndex, dayIndex)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Exercise
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4">
          <Button type="submit">Save Plan</Button>
        </div>
      </form>
    </Form>
  );
};

export default WorkoutPlanForm; 