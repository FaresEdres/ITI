<template>
  <div>
    <!-- Button trigger modal - Updated for Bootstrap 5 -->


    <!-- Modal - Updated for Bootstrap 5 -->
    <div 
      class="modal fade" 
      id="exampleModal" 
      tabindex="-1" 
      aria-labelledby="exampleModalLabel" 
      aria-hidden="true"
    >
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="exampleModalLabel">Add Student</h5>
            <button 
              type="button" 
              class="btn-close" 
              data-bs-dismiss="modal" 
              aria-label="Close"
            ></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="handleSubmit" >

                   <div class="mb-3">
                <label class="form-label" for="studentId">Id </label>
                    <input type="number" id="studentId" class="form-control" v-model="formData.id" required >
               

            </div>


             <div class="mb-3">
                <label for="name" class="form-label">Name</label>
                <input type="text" id="name" class="form-control" v-model="formData.name" required>
            </div>


            <div class="mb-3">
                <label class="form-label" for="city">City</label>
                <input type="text" class="form-control" id="city" v-model="formData.city" required>

            </div>

            <button type="submit" class="btn btn-primary" data-bs-dismiss="modal">Add Student</button>
            </form>
            </div>
          <div class="modal-footer">
            <button 
              type="button" 
              class="btn btn-secondary" 
              data-bs-dismiss="modal"
            >
              Close
            </button>
           
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import students from '@/students';

export default {
    data:()=>({
        students:students,
        formData:{
            id:"",
            name:"",
            city:""

        }
    }),
    methods:{
        handleSubmit(){
            this.students.push(this.formData);
        }
    }
}
</script>

<style scoped>
</style>