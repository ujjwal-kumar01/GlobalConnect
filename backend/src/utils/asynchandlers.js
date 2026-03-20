// const asyncHandlers = (fun)=> async (req,res,next)=>{
//     try{
//         await fun(req,res,next);
//     }catch(error){
//         res.status(err.code || 500).json({
//             success :false,
//             message : err.message
//         })
//     }
// }


const asyncHandler = (requestToHandle)=>{
    return (req,res,next)=>{
        Promise.resolve(requestToHandle(req,res,next))
        .catch((err)=>next(err))
    }
}

export {asyncHandler}